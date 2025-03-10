import { useOfflineLinkStore } from "@/store/useOfflineLinkStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";

const QueueVisualization = () => {
  const operationsQueue: any[] = useOfflineLinkStore((state) => state.getOperations());
  const op = operationsQueue.map((item, i) =>
    item.operation.variables.record.id.toString().slice(-6)
  );

  /*   useEffect(() => {
    const func = async () => {
      const item = await AsyncStorage.getItem("apollo-offline-operations");
      console.log("item", JSON.parse(item || ""));
    };
    func();
  }, [AsyncStorage.getItem("apollo-offline-operations")]); */

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cola (Queue)</Text>

      <View style={styles.queueContainer}>
        {op.length === 0 ? (
          <Text style={styles.emptyText}>Cola vacía</Text>
        ) : (
          <>
            <View style={{ flexDirection: "row", gap: "1rem" }}>
              {op.length &&
                op.map((item, index) => (
                  <View
                    key={index}
                    style={[
                      styles.itemContainer,
                      index === 0
                        ? styles.frontItem
                        : index === op.length - 1
                        ? styles.backItem
                        : styles.middleItem,
                    ]}
                  >
                    <Text style={styles.itemText}>{JSON.stringify(item)}</Text>
                    <Text style={styles.indexText}>#{index}</Text>
                  </View>
                ))}
            </View>

            <View style={styles.operationsContainer}>
              <Text style={styles.operationText}>← Primera</Text>
              <Text style={styles.operationText}>Ultima →</Text>
            </View>
          </>
        )}
      </View>

      <Text style={styles.countText}>Elementos: {operationsQueue.length}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    flexWrap: "nowrap",
  },
  queueContainer: {
    width: "100%",
    borderWidth: 2,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 16,
    backgroundColor: "#f9fafb",
  },
  emptyText: {
    textAlign: "center",
    color: "#6b7280",
    padding: 16,
  },
  labelsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: {
    fontWeight: "600",
  },
  itemContainer: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    marginVertical: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "red",
  },
  frontItem: {
    backgroundColor: "#bbf7d0", // light green
  },
  backItem: {
    backgroundColor: "#bfdbfe", // light blue
  },
  middleItem: {
    backgroundColor: "#e5e7eb", // light gray
  },
  itemText: {
    fontFamily: "monospace",
  },
  indexText: {
    fontSize: 12,
    color: "#6b7280",
  },
  operationsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  operationText: {
    fontSize: 12,
    color: "#6b7280",
  },
  countText: {
    marginTop: 16,
    fontSize: 14,
    color: "#4b5563",
  },
});

export default QueueVisualization;
