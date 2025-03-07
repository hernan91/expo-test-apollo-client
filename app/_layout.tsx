import { offlineLink } from "@/components/OfflineLink";
import QueueVisualization from "@/components/QueueVisualization";
import { initApolloClient } from "@/lib/client";
import { ApolloProvider } from "@apollo/client";
import { Stack } from "expo-router";

import { useEffect, useState } from "react";
import { Text } from "react-native";

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
      <QueueVisualization
        queue={offlineLink.operations.map((op, i) =>
          op.operation.variables.record.id.toString().slice(-6)
        )}
      />
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
