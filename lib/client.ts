import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloLink,
  from,
  Observable,
  createHttpLink,
  Operation,
} from "@apollo/client";
import { RetryLink } from "@apollo/client/link/retry";
import { onError } from "@apollo/client/link/error";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo, { useNetInfo } from "@react-native-community/netinfo";
import { AppState } from "react-native";
import { setContext } from "@apollo/client/link/context";
import { loadErrorMessages, loadDevMessages } from "@apollo/client/dev";
import * as Network from "expo-network";

const cache = new InMemoryCache();

const httpLink = createHttpLink({
  uri: "http://192.168.2.128:4000",
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

/**  Apollo link es middleware que gestiona las OPERACIONES offline (no confundir, NO ALMACENA LOS DATOS),
 * hacemos nuestra propia implementacion para tener mas control sobre las operaciones offline
 * y poder hacerlas persistentes, guardandolas en AsyncStorage
 * tambien, se encarga de
 * */
export class OfflineLink extends ApolloLink {
  operations: { operation: Operation; forward: any }[]; // CREAR EL TIPO
  isOnline: boolean;

  constructor() {
    console.warn("OfflineLink constructor");
    super();

    this.operations = [];
    this.isOnline = true;

    // en cada inicio de app se cargan las operaciones que hayan quedado pendientes en storage
    this.loadOperations();

    // En caso que la app se quede sin internet, se guarda la operacion en la cola
    Network.addNetworkStateListener((state) => {
      console.warn("NetInfo state", state);
      const wasOffline = !this.isOnline;
      this.isOnline = !!state.isConnected;

      // Si pasamos de un estado offline a online, se procesan las operaciones pendientes
      if (wasOffline && this.isOnline) {
        this.processQueue();
      }
    });
  }

  /**
   * uso: si la app se cerro y se borro la cache, se recargan las operaciones pendientes en OfflineLink
   */
  async loadOperations() {
    console.warn("Loading offline operations");
    try {
      const saved = await AsyncStorage.getItem("apollo-offline-operations");
      if (saved) this.operations = JSON.parse(saved);
    } catch (e) {
      console.error("Error loading offline operations", e);
    }
  }

  async saveOperations() {
    console.warn("Saving offline operations");
    try {
      await AsyncStorage.setItem("apollo-offline-operations", JSON.stringify(this.operations));
    } catch (e) {
      console.error("Error saving offline operations", e);
    }
  }

  processQueue() {
    console.warn("Processing offline queue");
    // Process pending operations
    const pending = [...this.operations];
    this.operations = [];
    this.saveOperations();

    pending.forEach((operation) => {
      operation.forward(operation.operation);
    });
  }

  //override del metodo request de ApolloLink, siempre devuelve un Observable
  request(operation: Operation, forward: any) {
    console.warn("OfflineLink request", operation.operationName);
    //se fija si hay internet

    if (this.isOnline) {
      //si hay internet pasa a HttpLink
      return forward(operation);
    }

    //Si no hay internet y la operacion es una mutacion la guarda en la cola
    if (
      operation.query.definitions.some(
        (def) => def.kind === "OperationDefinition" && def.operation === "mutation"
      )
    ) {
      this.operations.push({ operation, forward });
      this.saveOperations();

      // Return optimistic response
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
      return new Observable((observer) => {
        const data = cache.readQuery({
          query: operation.query,
          variables: operation.variables,
        });
        observer.next({ data });
        observer.complete();
      });
    }
  }
}

// Function to persist cache
const persistCache = async () => {
  console.warn("Persisting Apollo cache");
  try {
    await AsyncStorage.setItem("apollo-cache", JSON.stringify(cache.extract()));
    console.warn("Apollo cache persisted");
  } catch (e) {
    console.error("Error persisting Apollo cache", e);
  }
};

// Function to initialize client
export const initApolloClient = async (offlineLink: any) => {
  let client = null;
  if (client) return client;
  // Restore cache first
  try {
    const savedCache = await AsyncStorage.getItem("apollo-cache");
    if (savedCache) {
      cache.restore(JSON.parse(savedCache));
    }
  } catch (e) {
    console.error("Error restoring Apollo cache", e);
  }

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
    cache,
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
      persistCache();
    }
  });

  // Also persist periodically while app is running
  setInterval(persistCache, 60000); // Every minute
  console.warn("main");
  loadDevMessages();
  loadErrorMessages();
  return client;
};

//y cada vez que internet vuelve o se va, Offline link es el responsable de manejar las operaciones
