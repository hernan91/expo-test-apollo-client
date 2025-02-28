import { ApolloProvider } from "@apollo/client";
import { Stack } from "expo-router";
import { initApolloClient } from "./client";
import { useEffect, useState } from "react";

export default function RootLayout() {
	const [client, setClient] = useState<any>(null);
	useEffect(() => {
		const func = async () => {
			const client = await initApolloClient();
			setClient(client);
		};
		func();
	}, []);

	return (
		<ApolloProvider client={client}>
			<Stack>
				<Stack.Screen name="home" options={{ headerShown: false }} />
			</Stack>
		</ApolloProvider>
	);
}
