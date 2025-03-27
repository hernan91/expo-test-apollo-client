import QueueVisualization from "@/components/QueueVisualization";
import { initApolloClient } from "@/lib/client";
import { useQueueStore } from "@/store/useQueueStore";
import { ApolloProvider } from "@apollo/client";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { useNetInfo } from "@react-native-community/netinfo";

export default function RootLayout() {
  const [client, setClient] = useState<any>(null);
  const queueStore = useQueueStore();
  const { isInternetReachable } = useNetInfo();

  const updateNetworkState = () => {
    queueStore.setIsOnline(!!isInternetReachable);
  };

  useEffect(() => {
    updateNetworkState();
  }, [isInternetReachable]);

  useEffect(() => {
    const func = async () => {
      if (queueStore.isOnline) {
        const client = await initApolloClient(queueStore);
        setClient(client);
      }
    };
    func();
  }, [queueStore.isOnline]);

  const executeMutations = () => {
    queueStore.setShouldUpdate(true);
  };

  return (
    <>
      <QueueVisualization onProcessRequest={executeMutations} />
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
