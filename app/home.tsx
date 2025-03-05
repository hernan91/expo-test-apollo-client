import { useMutation, useQuery } from "@apollo/client";
import { CREATE_EXTERAL_PIPING_RECORD, GET_PIPING_RECORDS, GET_TASKSLIST } from "../lib/querys";
import { useEffect, useState } from "react";
import { Button, ScrollView, Text, TextInput, View } from "react-native";
import { useNetworkState } from "expo-network";
import { useReliableNetworkState } from "@/lib/useReliableNetworkState";

export default function () {
  const networkState = useReliableNetworkState();
  const [mutationText, setMutationText] = useState(JSON.stringify(dummyRecord, null, 2));

  const {
    data: pipingData,
    loading,
    error,
  } = useQuery(GET_PIPING_RECORDS, {
    variables: {
      page: 0,
      size: 20,
      sort: [
        {
          direction: "DESC",
          field: "material",
        },
      ],
      filter: [
        {
          field: "active",
          op: "equals",
          value: "false",
        },
      ],
    },
    skip: false,
  });

  const [createExternalPipingRecord, responseCreateRecord] = useMutation(
    CREATE_EXTERAL_PIPING_RECORD,
    {
      onCompleted: async () => {
        console.log({ responseCreateRecord });
      },
      onError: async (err) => {
        console.log("hubo un error al crear el record");
      },
    }
  );

  useEffect(() => {
    const func = async () => {
      if (!!pipingData) {
      }
    };
    func();
  }, [pipingData]);

  const logCreateRecords = () => {
    if (loading) {
      return "Cargando records...";
    }
    if (error) {
      return "Error en la obtencion de records...";
    }
    if (pipingData) {
      return "Se obtuvieron los records";
    }
  };

  const logInsertRecord = () => {
    if (responseCreateRecord.loading) {
      return "Creando record...";
    }
    if (responseCreateRecord.error) {
      return `Error creando record: ${responseCreateRecord.error.message}`;
    }

    return "Record creado";
  };

  const handleCreateRecord = () => {
    createExternalPipingRecord({
      variables: JSON.parse(mutationText),
      optimisticResponse: {
        __typename: "Mutation",
        addTodo: {
          __typename: "Todo",
          id: "temp-id",
          text: "Comprar leche",
          completed: false,
        },
      },

      // Update function: cómo actualizar el caché
      update: (cache, { data: { addTodo } }) => {
        // Leer los datos actuales
        const existingRecords = cache.readQuery({
          query: GET_PIPING_RECORDS,
        });
        console.log({ existingRecords });

        // Escribir los datos con el nuevo todo
        cache.writeQuery({
          query: GET_PIPING_RECORDS,
          data: {
            todos: [...existingRecords, addTodo],
          },
        });
      },
    });
  };

  return (
    <ScrollView>
      <Text>{JSON.stringify(networkState, null, 2)}</Text>
      <TextInput
        multiline={true}
        value={mutationText}
        style={{ backgroundColor: "grey", color: "white", width: 442, height: 442 }}
        onChange={(elem) => setMutationText(elem.nativeEvent.text)}
      ></TextInput>
      <Button title="Crear record" disabled={!networkState} onPress={handleCreateRecord}></Button>
      <Text>{logCreateRecords()}</Text>
      <Text>{logInsertRecord()}</Text>
    </ScrollView>
  );
}

const dummyRecord = {
  record: {
    task: "67bcae34a3efe6e98dea31b8",
    id: "17bca26e67f559eeded23e95",
    material: "material2",
    fluid: "fluido2",
    diameter: 5,
    equipmentCondition: "condicion",
    designPressure: 10,
    designTemperature: 100,
    operationalPressure: 1000,
    operationalTemperature: 10000,
    schedule: "schedule",
    items: [
      {
        name: "nombre",
        status: "ok",
        observations: "observación",
        imagePaths: ["ruta/imagen3.jpg", "ruta/imagen4.jpg"],
      },
    ],
  },
};
