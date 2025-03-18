import { OfflineLink } from "@/lib/OfflineLink";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Button, ActivityIndicator } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { QueueState, useQueueStore } from "@/store/useQueueStore";

const QueueVisualization = () => {
  const queueState = useQueueStore();

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

  /*   const handleOnlineChange = () => {
    offlineLink.toggleOnline();
  }; */

  const uploadIcon = (
    <Ionicons name="arrow-up" size={32} color={queueState.isOnline ? "green" : "red"} />
  );
  const syncIcon = <Ionicons name="sync" size={32} color={queueState.isOnline ? "green" : "red"} />;
  const errorIcon = <Ionicons name="close-circle-outline" size={32} color="red" />;
  const loadingIcon = <ActivityIndicator />;

  const getStateIcon = () => {
    if (queueState.loading) return loadingIcon;
    if (queueState.error) return errorIcon;
    if (queueState.operations.length > 0) return uploadIcon;
    return syncIcon;
  };

  return (
    <View style={styles.container}>
      <Text>{getStateIcon()}</Text>
      <Text>items:{queueState.operations.length}</Text>
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
