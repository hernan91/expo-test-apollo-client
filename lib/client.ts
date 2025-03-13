import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloLink,
  from,
  Observable,
  createHttpLink,
  Operation,
  gql,
} from "@apollo/client";
import { RetryLink } from "@apollo/client/link/retry";
import { onError } from "@apollo/client/link/error";
import NetInfo, { useNetInfo } from "@react-native-community/netinfo";
import { AppState } from "react-native";
import { setContext } from "@apollo/client/link/context";
import { loadErrorMessages, loadDevMessages } from "@apollo/client/dev";
import * as Network from "expo-network";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AsyncStorageWrapper, persistCache } from "apollo3-cache-persist";
import { CachePersistor } from "apollo3-cache-persist";

const dataCache = new InMemoryCache();
const operationsCache = new InMemoryCache();
const apolloCachePersistor = new CachePersistor({
  cache: dataCache,
  storage: new AsyncStorageWrapper(AsyncStorage),
  key: "apollo-data-cache",
});
const apolloOfflineOperationsPersistor = new CachePersistor({
  cache: operationsCache,
  storage: new AsyncStorageWrapper(AsyncStorage),
  key: "apollo-offline-operations",
});

const httpLink = createHttpLink({
  uri: "http://192.168.2.105:4000",
});

const authLink = setContext(async (_, { headers }) => {
  const token = await AsyncStorage.getItem("authtoken");
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

export type QueueState = {
  operations: any[];
  length: number;
  isOnline: boolean;
};

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

  constructor() {
    console.warn("OfflineLink constructor");
    super();

    this.operations = [];

    /* if (this.isOnline && this.operations.length > 0) {
      console.log("procesa la cola de netinfo");
      this.processQueue();
    } */

    this.updateNetworkState();

    //isOnline es solo a modo de pruebas para controlar el acceso a internet

    this.errorState = false;
    this.observers = new Set();

    // en cada inicio de app se cargan las operaciones que hayan quedado pendientes en storage
    /* this.restoreOperations().then(() => {
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
    this.isOnline = !!state.isConnected;
  }

  suscribe(callback: (queueState: QueueState) => void) {
    this.observers.add(callback);
    callback({ ...this.getPendingOperations(), isOnline: this.isOnline || false });
    return () => this.unsuscribe(callback);
  }

  unsuscribe(callback: (queueState: QueueState) => void) {
    this.observers.delete(callback);
  }

  notifyObservers() {
    const state = this.getPendingOperations();
    this.observers.forEach((callback) => callback({ ...state, isOnline: this.isOnline || false }));
  }

  /**
   * uso: si la app se cerro y se borro la cache, se recargan las operaciones pendientes en OfflineLink
   */
  async restoreOperations() {
    console.warn("Loading offline operations");
    console.log({ window });
    await apolloOfflineOperationsPersistor.restore();
    console.log({ ops: this.operations });
    this.operations =
      (await operationsCache.readQuery({
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
    operationsCache.writeQuery({
      query: gql`
        query GetOps {
          operations
        }
      `,
      data: { operations: this.operations },
    });
    await apolloOfflineOperationsPersistor.persist();
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
    const firstOp = this.operations[0];

    console.log({ operations: this.operations, firstOp });
    //TODO fijate si aca forward es nulo o que onda

    firstOp.forward(firstOp.operation).subscribe({
      next: (result: any) => {
        console.log("Offline queue result", result);
        this.operations.shift();
        this.persistOperations();
        this.notifyObservers();
        this.processQueue();
      },
      error: (error: any) => {
        console.error("Error processing offline queue", error);
        this.errorState = true;
      },
    });
  }

  toggleOnline() {
    console.log("toggleOnline");
    this.isOnline = !this.isOnline;
    console.log({ onlineClient: this.isOnline });
    this.notifyObservers();
    if (this.isOnline) this.processQueue();
  }

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
      this.operations.push({ operation, forward });
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
        const data = dataCache.readQuery({
          query: operation.query,
          variables: operation.variables,
        });
        observer.next({ data });
        observer.complete();
      });
    }
  }
}

//apollo-cache

// Function to initialize client
export const initApolloClient = async (offlineLink: any) => {
  let client = null;
  if (client) return client;
  // Restore cache first
  console.log("initApolloClient");
  //await apolloCachePersistor.restore();
  //await apolloOfflineOperationsPersistor.restore();
  console.log("finish restore");

  // Create Apollo client
  client = new ApolloClient({
    link: from([
      onError(({ graphQLErrors, networkError }) => {
        // Handle errors
        if (graphQLErrors) {
          graphQLErrors.forEach(({ message, locations, path }) =>
            console.warn(
              `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
            )
          );
        }
        if (networkError) console.warn(`[Network error]: ${networkError}`);
      }),
      offlineLink,
      /**
			 * RetryLink: Es proactivo: Recibe la operación de OfflineLink y la pasa a HttpLink (flujo hacia adelante)
				Monitorea resultados: Si HttpLink falla con ciertos errores (como timeout o error 500), RetryLink intercepta automáticamente ese error
				Mecanismo de reintento: Cuando detecta un error recuperable, RetryLink:

				Espera un intervalo definido
				Reenvía la misma operación a HttpLink nuevamente
				Puede intentarlo múltiples veces según su configuración
			 */
      new RetryLink(),
      authLink.concat(httpLink),
    ]),
    cache: dataCache,
    defaultOptions: {
      query: {
        fetchPolicy: "cache-first",
      },
    },
  });

  //TO-DO agregar persistencia con expo-background-fetch'
  // Ver archivo backgroundFetch.ts
  // Set up AppState listener to persist on background/inactive
  //De la forma en que esta hecho esto es que la app pasa a segundo plano se guardan los datos en cache, eso es mejorable con la libreria que hace que la cache sea persistente aumaticamente,  ver archivo "persistenciaCache"
  AppState.addEventListener("change", (nextAppState) => {
    console.warn("AppState change", nextAppState);
    if (nextAppState === "background" || nextAppState === "inactive") {
      apolloCachePersistor.persist();
      apolloOfflineOperationsPersistor.persist();
    }
  });

  // Also persist periodically while app is running
  setInterval(() => {
    apolloCachePersistor.persist();
    apolloOfflineOperationsPersistor.persist();
  }, 60000); // Every minute
  console.warn("main");
  loadDevMessages();
  loadErrorMessages();
  return client;
};

//y cada vez que internet vuelve o se va, Offline link es el responsable de manejar las operaciones
