import {
  ApolloLink,
  gql,
  InMemoryCache,
  Observable,
  Operation,
  NextLink,
  FetchResult,
} from "@apollo/client";

import * as Network from "expo-network";
import { AsyncStorageWrapper, CachePersistor } from "apollo3-cache-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
    console.warn("OfflineLink constructor");
    super();

    this.cache = cache;
    this.cachePersistor = dataPersistor;
    this.queueStore = queueStore;
    this.observers = new Set();
    useQueueStore.subscribe((queueState) => {
      this.queueStore = queueState;
      console.log("algo cambio en queue store");
    });

    /* if (this.isOnline && this.operations.length > 0) {
      console.log("procesa la cola de netinfo");
      this.processQueue();
    } */

    //isOnline es solo a modo de pruebas para controlar el acceso a internet

    // en cada inicio de app se cargan las operaciones que hayan quedado pendientes en storage

    /* console.log({ window }); */
    /*    this.restoreOperations().then(() => {
      this.processQueue();
    }); */

    // En caso que la app se quede sin internet, se guarda la operacion en la cola
    Network.addNetworkStateListener(async (state) => {
      console.warn("NetInfo state", state);
      await this.updateNetworkState();
      this.processQueue();

      // Si pasamos de un estado offline a online, se procesan las operaciones pendientes
      //if (wasOffline && this.isOnline) {
    });
  }

  async updateNetworkState() {
    const state = await Network.getNetworkStateAsync();
    console.log({ elstate: state });
    this.queueStore.setIsOnline(!!state.isInternetReachable);
  }

  /**
   * uso: si la app se cerro y se borro la cache, se recargan las operaciones pendientes en OfflineLink
   */
  async restoreOperations() {
    console.warn("Loading offline operations");

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
    console.warn("Saving offline operations");
    this.cache.writeQuery({
      query: gql`
        query GetOps {
          operations
        }
      `,
      data: { operations: this.queueStore.operations },
    });
    await this.cachePersistor.persist();
  }

  processQueue() {
    /*     console.warn("Processing offline queue");
    // Process pending operations
    const pending = [...this.operations];
    this.operations = [];
    this.saveOperations();
    pending.forEach((operation) => {
      operation.forward(operation.operation);
      this.notifyObservers();
    }); */
    //TODO fijate que aca deberia detenerse cuando hay un error, que no avance hasta que se complete la operacion, posible solucion
    console.warn("Processing offline queue");
    if (!this.queueStore.operations || this.queueStore.operations.length === 0) return;
    this.queueStore.loading = true;

    const firstOp = this.queueStore.operations[0];

    //TODO fijate si aca forward es nulo o que onda

    firstOp.forward(firstOp.operation).subscribe({
      ///PASAR A SUS PROPIAS FUNCIONES A NEXT Y ERROR
      next: (result: any) => {
        this.queueStore.setLoading(false);
        if (!result?.errors) {
          this.queueStore.popOperation();
          this.persistOperations();
          this.processQueue();
        }
        return this.queueStore.setError({ message: result.errors[0].message });
      },
      error: (error: any) => {
        this.queueStore.loading = false;
        this.queueStore.setError({ message: error.message });
      },
    });
  }

  /*   toggleOnline() {
    console.log("toggleOnline");
    this.isOnline = !this.isOnline;
    console.log({ onlineClient: this.isOnline });
    this.notifyObservers();
    if (this.isOnline) this.processQueue();
  } */

  /*   setOperations(operations: any[]) {
    this.operations = operations;
  } */

  /*   getPendingOperations() {
    return {
      operations: this.operations?.slice() || [],
      length: this.operations.length,
      // Otros datos relevantes
    };
  } */

  pushNewOperation(operation: any, forward: any) {
    this.queueStore.pushOperation({ operation, forward });
  }

  onSuccessFullOperation(result: any) {
    this.queueStore.setLoading(false);
    if (result?.errors) {
      return this.queueStore.setError({ message: result.errors[0].message });
    }
    console.log("error state: false");
    this.queueStore.setError(null);
    this.queueStore.popOperation();
    this.persistOperations();
  }

  //override del metodo request de ApolloLink, siempre devuelve un Observable
  request(operation: Operation, forward: any): Observable<FetchResult> | null {
    //Forward = NextLink
    console.log("entra en request");
    const operationDefinitions: OperationDefinitionNode[] = operation.query.definitions.filter(
      (def) => def.kind === "OperationDefinition"
    );
    const isMutation = operationDefinitions.some((def) => def.operation === "mutation");
    const isQuery = operationDefinitions.some((def) => def.operation === "query");
    if (isMutation) {
      //this.pushNewOperation(operation, forward);
      this.queueStore.pushOperation({ operation, forward });
      this.persistOperations();

      if (this.queueStore.isOnline) {
        this.queueStore.setLoading(true);
        this.queueStore.setError(null);
        forward(operation).subscribe({
          next: (result: FetchResult) => {
            this.queueStore.setLoading(false);
            if (!result?.errors) {
              this.queueStore.popOperation();
              this.persistOperations();
              return { data: result.data };
            }
            this.queueStore.setError({ message: result.errors[0].message });
            return { data: result };
          },
          error: (e) => {
            this.queueStore.loading = false;
            this.queueStore.setError({ message: e });
          },
        });
      }
    }
    if (isQuery) {
      if (!this.queueStore.isOnline) {
        return new Observable((observer) => {
          observer.next({ data: operation.getContext().optimisticResponse });
          observer.complete();
        });
      }
      return new Observable((observer) => {
        const data: any = this.cache.readQuery({
          query: operation.query,
          variables: operation.variables,
        });
        observer.next({ data });
        observer.complete();
      });
    }

    return null;

    // Si no hay internet y la operacion es una query, busca los datos en cache
  }
}
