import { ApolloLink, gql, InMemoryCache, Observable, Operation } from "@apollo/client";
import { QueueState } from "./client";
import * as Network from "expo-network";
import { AsyncStorageWrapper, CachePersistor } from "apollo3-cache-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**  Apollo link es middleware que gestiona las OPERACIONES offline (no confundir, NO ALMACENA LOS DATOS),
 * hacemos nuestra propia implementacion para tener mas control sobre las operaciones offline
 * y poder hacerlas persistentes, guardandolas en AsyncStorage
 * tambien, se encarga de
 * */
export class OfflineLink extends ApolloLink {
  operations: { operation: Operation; forward: any }[]; // CREAR EL TIPO
  errorState: boolean;
  isOnline: boolean | undefined;
  observers: Set<(queueState: QueueState) => void>;
  dataCache: InMemoryCache;
  loading: boolean;

  dataPersistor: CachePersistor<any>;

  constructor(cache: InMemoryCache, dataPersistor: CachePersistor<any>) {
    console.warn("OfflineLink constructor");
    super();

    this.operations = [];
    this.dataCache = cache;
    this.loading = false;

    this.dataPersistor = dataPersistor;

    this.errorState = false;
    this.observers = new Set();
    this.updateNetworkState();

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
      this.notifyObservers();
      this.processQueue();

      // Si pasamos de un estado offline a online, se procesan las operaciones pendientes
      //if (wasOffline && this.isOnline) {
    });
  }

  async updateNetworkState() {
    const state = await Network.getNetworkStateAsync();
    this.isOnline = !!state.isConnected;
  }

  suscribe(callback: (queueState: QueueState) => void) {
    this.observers.add(callback);
    callback({
      ...this.getPendingOperations(),
      isOnline: this.isOnline || false,
      errorState: this.errorState,
      loading: this.loading,
    });
    return () => this.unsuscribe(callback);
  }

  unsuscribe(callback: (queueState: QueueState) => void) {
    this.observers.delete(callback);
  }

  notifyObservers() {
    const state = this.getPendingOperations();
    console.log("notifica");
    this.observers.forEach((callback) =>
      callback({
        ...state,
        isOnline: this.isOnline || false,
        errorState: this.errorState,
        loading: this.loading,
      })
    );
  }

  /**
   * uso: si la app se cerro y se borro la cache, se recargan las operaciones pendientes en OfflineLink
   */
  async restoreOperations() {
    console.warn("Loading offline operations");

    await this.dataPersistor.restore();
    console.log({ ops: this.operations });
    this.operations =
      (await this.dataCache.readQuery({
        query: gql`
          query GetOps {
            operations
          }
        `,
      })?.operations) || [];
    console.log({ ops: this.operations });
  }

  async persistOperations() {
    console.warn("Saving offline operations");
    this.dataCache.writeQuery({
      query: gql`
        query GetOps {
          operations
        }
      `,
      data: { operations: this.operations },
    });
    await this.dataPersistor.persist();
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
    if (!this.operations || this.operations.length === 0) return;
    this.loading = true;

    const firstOp = this.operations[0];

    console.log({ operations: this.operations, firstOp });
    //TODO fijate si aca forward es nulo o que onda

    firstOp.forward(firstOp.operation).subscribe({
      next: (result: any) => {
        if (result?.errors) {
          this.errorState = true;
          return this.notifyObservers();
        }
        console.log("error state: false");
        this.errorState = false;
        //el loading no va aca, aca seria loading false
        console.log("Offline queue result", result);
        this.operations.shift();

        this.loading = false;
        this.notifyObservers();
        this.persistOperations();
        this.processQueue();
      },
      error: (error: any) => {
        console.error("Error processing offline queue", error);
        console.log("error state: true");

        this.loading = false;
        this.errorState = true;
        this.notifyObservers();
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

  getPendingOperations() {
    return {
      operations: this.operations?.slice() || [],
      length: this.operations.length,
      // Otros datos relevantes
    };
  }

  pushNewOperation(operation: any, forward: any) {
    this.operations.push({ operation, forward });
    this.notifyObservers();
  }

  //override del metodo request de ApolloLink, siempre devuelve un Observable
  request(operation: Operation, forward: any) {
    console.warn("OfflineLink request", { isOnline: this.isOnline });
    //se fija si hay internet
    console.log("esta onlineeeeee", this.isOnline);

    if (this.isOnline) {
      //si hay internet pasa a HttpLink
      console.log("si hay internet pasa a HttpLink");
      return forward(operation);
    }

    //Si no hay internet y la operacion es una mutacion la guarda en la cola
    if (
      operation.query.definitions.some(
        (def) => def.kind === "OperationDefinition" && def.operation === "mutation"
      )
    ) {
      console.log("si no hay internet y la operacion es una mutacion la guarda en la cola");

      this.pushNewOperation(operation, forward);
      this.persistOperations();

      // Return optimistic response
      console.log("optimisticResponse", operation.getContext().optimisticResponse);
      return new Observable((observer) => {
        observer.next({ data: operation.getContext().optimisticResponse });
        observer.complete();
      });
    }

    // Si no hay internet y la operacion es una query, busca los datos en cache
    if (
      operation.query.definitions.some(
        (def) => def.kind === "OperationDefinition" && def.operation === "query"
      )
    ) {
      console.log("es una query y no hay internet, busca los datos en cache");
      return new Observable((observer) => {
        const data = this.dataCache.readQuery({
          query: operation.query,
          variables: operation.variables,
        });
        observer.next({ data });
        observer.complete();
      });
    }
  }
}
