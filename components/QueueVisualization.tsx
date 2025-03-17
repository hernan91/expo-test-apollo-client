import { QueueState } from "@/lib/client";
import { OfflineLink } from "@/lib/OfflineLink";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Button, ActivityIndicator } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

const QueueVisualization = ({ offlineLink }: { offlineLink: OfflineLink }) => {
  //const operationsQueue: any[] = useOfflineLinkStore((state) => state.getOperations());
  /* const op = operationsQueue.map((item, i) =>
    item.operation.variables.record.id.toString().slice(-6)
  ); */

  /*   useEffect(() => {
    const func = async () => {
      const item = await AsyncStorage.getItem("apollo-offline-operations");
      console.log("item", JSON.parse(item || ""));
    };
    func();
  }, [AsyncStorage.getItem("apollo-offline-operations")]); */

  const [queue, setQueue] = useState<QueueState>({
    operations: [],
    length: 0,
    isOnline: false,
    errorState: false,
    loading: false,
  });

  const handleUpdateSignal = (queueState: QueueState) => {
    setQueue(queueState);
    console.log("update Signal", { isOnline: queueState.isOnline });
  };

  useEffect(() => {
    if (offlineLink) {
      const observer = offlineLink.suscribe(handleUpdateSignal);
      return offlineLink.unsuscribe(observer);
    }
  }, [offlineLink]);

  /*   const handleOnlineChange = () => {
    offlineLink.toggleOnline();
  }; */

  const uploadIcon = (
    <Ionicons name="arrow-up" size={32} color={queue.isOnline ? "green" : "black"} />
  );
  const syncIcon = <Ionicons name="sync" size={32} color={queue.isOnline ? "green" : "black"} />;
  const errorIcon = <Ionicons name="close-circle-outline" size={32} color="red" />;
  const loadingIcon = <ActivityIndicator />;

  const getStateIcon = () => {
    if (queue.loading) return loadingIcon;
    if (queue.errorState) return errorIcon;
    if (queue.length > 0) return uploadIcon;
    return syncIcon;
  };

  return (
    <View style={styles.container}>
      {getStateIcon()} <Text>items:{queue.length}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: "center",
  },
  netState: {
    width: "100%",
    padding: 5,
    marginBottom: 10,
    textAlign: "center",
    color: "white",
  },
});

export default QueueVisualization;

/* No se devuelven {data, loading, error} correctamente cuando se hace la mutation 
Hay un error con firstOp que no tiene metodo forward, fijate como se almacenan en cache, porque en storage no existe forward


Descomentar linea 87 */
