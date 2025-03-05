import { useMutation, useQuery } from "@apollo/client";
import { CREATE_EXTERAL_PIPING_RECORD, GET_PIPING_RECORDS, GET_TASKSLIST } from "../lib/querys";
import { useEffect } from "react";
import { ScrollView, Text, View } from "react-native";

export default function () {
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

	const [createExternalPipingRecord, responseCreateRecord] = useMutation(CREATE_EXTERAL_PIPING_RECORD, {
		onCompleted: async () => {
			console.log({ responseCreateRecord });
		},
		onError: async (err) => {
			console.log("hubo un error en la autenticacion");
		},
	});

	useEffect(() => {
		const func = async () => {
			if (!!pipingData) {
				createExternalPipingRecord({
					variables: {
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
					},
				});
			}
		};
		func();
	}, [pipingData]);

	const logCreateRecords = () => {
		if (loading) {
			return (
				<View>
					<Text>Cargando records...</Text>
				</View>
			);
		}
		if (error) {
			return (
				<View>
					<Text>Error en la obtencion de records...</Text>
				</View>
			);
		}
		if (pipingData) {
			return (
				<View>
					<Text>Se obtuvieron los records</Text>
				</View>
			);
		}
	};

	const logInsertRecord = () => {
		if (responseCreateRecord.loading) {
			return (
				<View>
					<Text>Creando record...</Text>
				</View>
			);
		}
		if (responseCreateRecord.error) {
			return (
				<View>
					<Text>Error creando record: {responseCreateRecord.error.message}</Text>
				</View>
			);
		}
		{
			JSON.stringify(pipingData, null, 2);
		}

		return (
			<View>
				<Text>Record creado</Text>
			</View>
		);
	};

	return (
		<ScrollView>
			{logCreateRecords()}
			{logInsertRecord()}
		</ScrollView>
	);
}
