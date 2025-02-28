import { useMutation } from "@apollo/client";
import { LOGIN } from "./querys";
import { jwtDecode } from "jwt-decode";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect } from "react";

export default function Login() {
	const [login, { loading, error }] = useMutation(LOGIN, {
		onCompleted: async (data) => {
			// remove any and add token to app context
			const decodedToken: any = jwtDecode(data.login.token);
			if (!decodedToken) return console.log("No se pudo decodificar el token");
			await AsyncStorage.setItem("authtoken", data.login.token);
		},
		onError: async (err) => {
			console.log("hubo un error en la autenticacion");
		},
	});

	loading && <div>Loading...</div>;

	useEffect(() => {
		login({ variables: { email: "juan.estol@petromark.com.ar", password: "123456" } });
	}, []);

	return (
		<>
			{loading && <div>Loading...</div>}
			{error && <div>Error...</div>}
			{!loading && !error && <div>Logueado</div>}
			<button disabled={loading || !!error} onClick={() => router.replace("/home")}>
				Ir home
			</button>
		</>
	);
}
