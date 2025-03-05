import { offlineLink } from "@/components/OfflineLink";
import QueueVisualization from "@/components/QueueVisualization";
import { initApolloClient } from "@/lib/client";
import { ApolloProvider } from "@apollo/client";
import { Stack } from "expo-router";

import { useEffect, useState } from "react";

export default function RootLayout() {
  const [client, setClient] = useState<any>(null);

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
      {JSON.stringify(offlineLink.operations.map((op) => op.operation.operationName))}
      <QueueVisualization queue={offlineLink.operations.map((op) => op.operation.operationName)} />
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
