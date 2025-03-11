import QueueVisualization from "@/components/QueueVisualization";
import { initApolloClient, OfflineLink } from "@/lib/client";
import { ApolloProvider } from "@apollo/client";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { Button } from "react-native";

export default function RootLayout() {
  const [client, setClient] = useState<any>(null);
  const offlineLink = new OfflineLink();

  useEffect(() => {
    const func = async () => {
      console.log("Initializing Apollo client");
      const client = await initApolloClient(offlineLink);
      setClient(client);
    };

    func();
  }, []);

  return (
    <>
      <QueueVisualization offlineLink={offlineLink} />
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
