import { useMutation } from "@apollo/client";
import { LOGIN } from "../lib/querys";
import { jwtDecode } from "jwt-decode";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect } from "react";
import { Button, Text, View } from "react-native";

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

	useEffect(() => {
		login({ variables: { email: "juan.estol@petromark.com.ar", password: "123456" } });
	}, []);

	return (
		<>
			{loading && (
				<View>
					<Text>Loading...</Text>
				</View>
			)}
			{error && (
				<View>
					<Text>Error...</Text>
				</View>
			)}
			{!loading && !error && (
				<View>
					<Text>Logueado</Text>
				</View>
			)}
			<Button title="Ir home" disabled={loading || !!error} onPress={() => router.replace("/home")}></Button>
		</>
	);
}
