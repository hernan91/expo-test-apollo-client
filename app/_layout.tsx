import { offlineLink } from "@/components/OfflineLink";
import QueueVisualization from "@/components/QueueVisualization";
import { initApolloClient } from "@/lib/client";
import { useOfflineLinkStore } from "@/store/useOfflineLinkStore";
import { ApolloProvider } from "@apollo/client";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { Button } from "react-native";

export default function RootLayout() {
  const offlineLink = useOfflineLinkStore((state) => state.offlineLink);
  const isOnline = useOfflineLinkStore((state) => state.offlineLink.isOnline);
  const toggleOnline = useOfflineLinkStore((state) => state.toggleOnline);
  const [client, setClient] = useState<any>(null);

  useEffect(() => {
    const func = async () => {
      console.log("Initializing Apollo client");
      const client = await initApolloClient(offlineLink);
      setClient(client);
    };

    func();
  }, []);

  const handleOnlineChange = () => {
    console.log("handleOnlineChange");
    toggleOnline();
  };

  return (
    <>
      <Button title={isOnline ? "set offline" : "set online"} onPress={handleOnlineChange} />
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
