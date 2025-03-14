import QueueVisualization from "@/components/QueueVisualization";
import { initApolloClient } from "@/lib/client";
import { ApolloProvider } from "@apollo/client";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";

export default function RootLayout() {
  const [client, setClient] = useState<any>(null);
  const [offlineLink, setOfflineLink] = useState<any>(null);

  useEffect(() => {
    const func = async () => {
      console.log("Initializing Apollo client");
      const [client, offlineLink] = await initApolloClient();
      setClient(client);
      setOfflineLink(offlineLink);
      console.log({ client });
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
