import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQueueStore } from "@/store/useQueueStore";

interface Props {
  onProcessRequest: () => void;
}

const QueueVisualization = ({ onProcessRequest }: Props) => {
  const { loading, error, isOnline, operations } = useQueueStore();

  const uploadIcon = (
    <Ionicons
      name="arrow-up"
      onPress={isOnline ? onProcessRequest : () => {}}
      size={32}
      color={isOnline ? "green" : "red"}
    />
  );
  const syncIcon = <Ionicons name="sync" size={32} color={isOnline ? "green" : "red"} />;
  const errorIcon = (
    <Ionicons
      onPress={isOnline ? onProcessRequest : () => {}}
      name="close-circle-outline"
      size={32}
      color="red"
    />
  );
  const loadingIcon = <ActivityIndicator size={32} />;

  const getStateIcon = () => {
    if (loading) return loadingIcon;
    if (error) return errorIcon;
    if (operations.length > 0) return uploadIcon;
    return syncIcon;
  };

  return (
    <View style={styles.container}>
      <Text>loading: {JSON.stringify(loading)}</Text>
      <Text>{getStateIcon()}</Text>
      <Text>items:{operations.length}</Text>
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
