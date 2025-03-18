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
import { OfflineLink } from "./OfflineLink";
import { QueueStore } from "@/store/useQueueStore";

const cache = new InMemoryCache();

const cachePersistor = new CachePersistor({
  cache: cache,
  storage: new AsyncStorageWrapper(AsyncStorage),
  key: "apollo-data-cache",
});

console.log("creacion de persistors");

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

//apollo-cache

// Function to initialize client
export const initApolloClient = async (queueStore: QueueStore) => {
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
      new OfflineLink(cache, cachePersistor, queueStore),
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
      /* new ApolloLink((operation, forward) => {
        return forward(operation).map((response) => {
          // Tu lógica para operaciones exitosas
          console.log("Operación exitosa:", operation.operationName);
          //queueStore.popOperation();
          return response;
        });
      }), */
    ]),
    cache: cache,
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
      cachePersistor.persist();
    }
  });

  // Also persist periodically while app is running
  setInterval(() => {
    cachePersistor.persist();
  }, 60000); // Every minute
  console.warn("main");
  loadDevMessages();
  loadErrorMessages();
  return client;
};

//y cada vez que internet vuelve o se va, Offline link es el responsable de manejar las operaciones
