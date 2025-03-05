/* import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";

const BACKGROUND_SYNC_TASK = "background-apollo-sync";

// Registrar la tarea
TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
	try {
		const netState = await NetInfo.fetch();

		if (netState.isConnected) {
			// Cargar operaciones pendientes
			const saved = await AsyncStorage.getItem("apollo-offline-operations");
			if (saved) {
				const operations = JSON.parse(saved);

				// Procesar operaciones
				if (operations.length > 0) {
					// Inicializar cliente Apollo temporalmente
					const tempClient = await initApolloClient();

					// Ejecutar operaciones
					operations.forEach((op) => {
						op.forward(op.operation);
					});

					// Limpiar cola
					await AsyncStorage.setItem("apollo-offline-operations", "[]");

					return BackgroundFetch.BackgroundFetchResult.NewData;
				}
			}
		}
		return BackgroundFetch.BackgroundFetchResult.NoData;
	} catch (error) {
		return BackgroundFetch.BackgroundFetchResult.Failed;
	}
});

// Registrar la tarea en initApolloClient
const initApolloClient = async () => {
	// Código existente...

	// Registrar tarea en background
	await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
		minimumInterval: 15 * 60, // 15 minutos (en segundos)
		stopOnTerminate: false,
		startOnBoot: true,
	});

	return client;
};
 */
