import { useMutation, useQuery } from "@apollo/client";
import { CREATE_EXTERAL_PIPING_RECORD, GET_PIPING_RECORDS, GET_TASKSLIST } from "../lib/querys";
import { useEffect, useState } from "react";
import { Button, ScrollView, Text, TextInput, View } from "react-native";
import { useNetworkState } from "expo-network";
import { useReliableNetworkState } from "@/lib/useReliableNetworkState";

function generateMongoObjectId() {
  const timestamp = Math.floor(Date.now() / 1000)
    .toString(16)
    .padStart(8, "0");
  const random = Array.from(new Uint8Array(8), () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, "0")
  ).join("");

  return timestamp + random;
}

export default function () {
  const networkState = useReliableNetworkState();
  const [mutationText, setMutationText] = useState(JSON.stringify(exampleRecord, null, 2));

  const {
    data: pipingData,
    loading,
    error,
  } = useQuery(GET_PIPING_RECORDS, {
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
    const newRecord = {
      //datos obtenidos desde alguna consulta tipo GET_ASSETS
      id: generateMongoObjectId(),
      ...JSON.parse(mutationText),

      //createdBy: "algun usuario",
      //createdAt: new Date().toISOString(),
    };

    const optimisticRecord = {
      ...newRecord,
      task: {
        asset: {
          id: "17bca26e67f559eeded23e95",
          name: "elAsset",
        },
        currentDailyPart: {
          code: "codigo",
          date: "fecha",
          costCenter: "centroCosto",
          operator: {
            name: "nombre",
            lastname: "apellido",
          },
          vehicle: "vehiculo",
        },
      },
      active: true,
    };
    //PARA CADA CONSULTA CON SU CONJUNTO DE VARIABLES SE VA A CREAR UNA NUEVA ENTRADA EN CACHE
    createExternalPipingRecord({
      variables: { record: { ...newRecord } },
      optimisticResponse: {
        __typename: "Mutation",
        createExternalPipingRecord: {
          __typename: "ExternalPipingRecord",
          ...optimisticRecord,
        },
      },

      // Update function: cómo actualizar el caché
      update: (cache, { data }) => {
        // Leer los datos actuales
        console.log({ data, optimisticRecord });
        const existingRecords: any = cache.readQuery({
          query: GET_PIPING_RECORDS,
        });

        const records = existingRecords?.findExternalPipingRecords?.records;

        //https://www.apollographql.com/docs/react/v2/performance/optimistic-ui

        // Escribir los datos con el nuevo todo

        cache.writeQuery({
          query: GET_PIPING_RECORDS,
          data: {
            findExternalPipingRecords: {
              __typename: "ExternalPipingRecord",
              records: [...records, { ...optimisticRecord }],
              count: records.length + 1,
            },
          },
        });
      },
    });
  };

  return (
    <ScrollView>
      {/*  <Text>{JSON.stringify(networkState, null, 2)}</Text> */}

      {pipingData?.findExternalPipingRecords?.records &&
        pipingData.findExternalPipingRecords.records.map((r) => <Text key={r.id}>{r.id}</Text>)}
      <Button title="Crear record" onPress={handleCreateRecord}></Button>
      <Text>{logCreateRecords()}</Text>
      <Text>{logInsertRecord()}</Text>
      <TextInput
        multiline={true}
        value={mutationText}
        style={{ backgroundColor: "grey", color: "white", width: 442, height: 442 }}
        onChange={(elem) => setMutationText(elem.nativeEvent.text)}
      ></TextInput>
    </ScrollView>
  );
}

const exampleRecord = {
  //id: "17bca26e67f559eeded23e95",
  task: "67bcae34a3efe6e98dea31b8",
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
};

/* asset: {
    name: "elAsset",
  },
  currentDailyPart: {}, */

/* 
	Ver tema imagenes, gestionas optimistic response en la mutation del path de la imagen cargada en el front,
	despues con update te comunicas con el back para subir a S3 y obtenes signedUrl y te volves a comunicar para 
	insertar el record con cada uno de los items con las signedUrls
*/
