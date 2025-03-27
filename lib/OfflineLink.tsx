import { ApolloLink, gql, InMemoryCache, Observable, Operation } from "@apollo/client";

import { CachePersistor } from "apollo3-cache-persist";
import { QueueState, QueueStore, useQueueStore } from "@/store/useQueueStore";
import { OperationDefinitionNode } from "graphql";

/**  Apollo link es middleware que gestiona las OPERACIONES offline (no confundir, NO ALMACENA LOS DATOS),
 * hacemos nuestra propia implementacion para tener mas control sobre las operaciones offline
 * y poder hacerlas persistentes, guardandolas en AsyncStorage
 * tambien, se encarga de
 * */
export class OfflineLink extends ApolloLink {
  observers: Set<(queueState: QueueState) => void>;
  cache: InMemoryCache;
  queueStore: QueueStore;

  cachePersistor: CachePersistor<Operation>;

  constructor(
    cache: InMemoryCache,
    dataPersistor: CachePersistor<Operation>,
    queueStore: QueueStore
  ) {
    super();

    this.cache = cache;
    this.cachePersistor = dataPersistor;
    this.queueStore = queueStore;
    this.observers = new Set();
    //this.restoreOperations();
    useQueueStore.subscribe((queueState) => {
      this.queueStore = queueState;
      if (queueState.shouldUpdate) {
        this.queueStore.setShouldUpdate(false);
        this.processQueue();
      }
    });
  }

  /**
   * uso: si la app se cerro y se borro la cache, se recargan las operaciones pendientes en OfflineLink
   */
  async restoreOperations() {
    await this.cachePersistor.restore();

    const operations =
      (await this.cache.readQuery({
        query: gql`
          query GetOps {
            operations
          }
        `,
      })?.operations) || [];
    this.queueStore.setOperations(operations);
  }

  async persistOperations() {
    this.cache.writeQuery({
      query: gql`
        query GetOps {
          operations @client
        }
      `,
      data: { operations: this.queueStore.operations },
    });
    await this.cachePersistor.persist();
  }

  processQueue() {
    if (!this.queueStore.operations || this.queueStore.operations.length === 0) return;

    this.queueStore.setLoading(true);
    this.queueStore.setError(null);

    const firstOp = this.queueStore.operations[0];

    return firstOp.forward(firstOp.operation).subscribe({
      next: async (result: any) => {
        if (!result?.errors) {
          await this.popFirstOperation();
          this.queueStore.setLoading(false);
          this.processQueue();
        } else this.queueStore.setError({ message: result.errors[0].message });
      },
      error: (error: any) => {
        this.queueStore.setError({ message: error.message });
        this.queueStore.setLoading(false);
      },
    });
  }

  async pushNewOperation(operation: any, forward: any) {
    this.queueStore.pushOperation({ operation, forward });
    await this.persistOperations();
  }

  async popFirstOperation() {
    await this.queueStore.popOperation();
    await this.persistOperations();
  }

  request(operation: Operation, forward: any) {
    //Forward = NextLink

    const operationDefinitions: OperationDefinitionNode[] = operation.query.definitions.filter(
      (def) => def.kind === "OperationDefinition"
    );

    const isMutation = operationDefinitions.some((def) => def.operation === "mutation");
    const isQuery = operationDefinitions.some((def) => def.operation === "query");

    if (isMutation) {
      const isLogin = operationDefinitions.some((od) =>
        od.selectionSet.selections.some((s) => s.kind === "Field" && s.name.value === "login")
      );

      if (isLogin) {
        return forward(operation);
      }

      this.queueStore.pushOperation({ operation, forward });
      this.persistOperations();

      return new Observable((observer) => {
        observer.next({ data: operation.getContext().optimisticResponse });
        observer.complete();
      });

      /* 
      this.queueStore.setError(null);

      return new Observable((observer) => {
        console.log("forward operation");
        forward(operation).subscribe({
          next: async (result: FetchResult) => {
            console.log({ result });
            if (!result.errors) {
              this.queueStore.popOperation();
              await this.persistOperations();
              observer.next({ data: result.data, loading: false });
              console.log("dentro del next de request");
              this.queueStore.setError(null);
            } else {
              this.queueStore.setError({ message: result?.errors[0].message });
              observer.next({ error: result?.errors[0].message, loading: false });
            }
            this.queueStore.setLoading(false);
            //this.queueStore.setError({ message: result?.errors[0].message });
          },
          error: (error: any) => {
            this.queueStore.setError({ message: error.message });
            observer.error({ message: error.message });
            this.queueStore.setLoading(false);
          },
        });
        observer.complete();
      }); */
    }
    if (isQuery) {
      this.queueStore.setLoading(true);
      if (!this.queueStore.isOnline) {
        return new Observable((observer) => {
          const data = this.cache.readQuery({
            query: operation.query,
            variables: operation.variables,
          });
          observer.next({ data, loading: false });
          this.queueStore.setLoading(false);
          observer.complete();
        });
      }
    }

    this.queueStore.setLoading(false);
    return forward(operation);
  }
}
