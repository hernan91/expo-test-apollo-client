import { useMutation, useQuery } from "@apollo/client";
import { CREATE_EXTERAL_PAPING_RECORD, GET_PIPING_RECORDS, GET_TASKSLIST } from "./querys";
import { useEffect } from "react";
import { ScrollView } from "react-native";

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
	});

	const [createExternalPipingRecord, responseCreateRecord] = useMutation(CREATE_EXTERAL_PAPING_RECORD, {
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
			return <div>Cargando records...</div>;
		}
		if (error) {
			return <div>Error en la obtencion de records...</div>;
		}
		if (pipingData) {
			return <div>Se obtuvieron los records</div>;
		}
	};

	const logInsertRecord = () => {
		if (responseCreateRecord.loading) {
			return <div>Creando record...</div>;
		}
		if (responseCreateRecord.error) {
			return <div>Error creando record: {responseCreateRecord.error.message}</div>;
		}

		return <div>Record creado</div>;
	};

	return (
		<ScrollView>
			{logCreateRecords()}
			{logInsertRecord()}
		</ScrollView>
	);
}
