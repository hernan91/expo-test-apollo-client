import QueueVisualization from "@/components/QueueVisualization";
import { initApolloClient } from "@/lib/client";
import { useQueueStore } from "@/store/useQueueStore";
import { ApolloProvider } from "@apollo/client";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import * as Network from "expo-network";

export default function RootLayout() {
  const [client, setClient] = useState<any>(null);
  const queueStore = useQueueStore();
  const [networkState, setNetworkState] = useState<Network.NetworkState>();

  useEffect(() => {
    const func = async () => {
      const status = await Network.getNetworkStateAsync();
      queueStore.setIsOnline(!!status.isInternetReachable);
    };
    func();
  }, []);

  useEffect(() => {
    const func = async () => {
      console.log("Initializing Apollo client");
      if (queueStore.isOnline) {
        const client = await initApolloClient(queueStore);
        setClient(client);
      }
    };
    func();
  }, [queueStore.isOnline]);

  return (
    <>
      <QueueVisualization />
      {client && (
        <ApolloProvider client={client}>
          <Stack>
            <Stack.Screen name="home" options={{ headerShown: false }} />
          </Stack>
        </ApolloProvider>
      )}
    </>
  );
}

/* 
	Se gestionan estados offline y online para hacer pruebas desde el navegador, 
	evitando movil que no tiene debugging
*/
