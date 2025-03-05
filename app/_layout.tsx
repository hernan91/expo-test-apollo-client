import { initApolloClient } from "@/lib/client";
import { ApolloProvider } from "@apollo/client";
import { Stack } from "expo-router";

import { useEffect, useState } from "react";

export default function RootLayout() {
	const [client, setClient] = useState<any>(null);
	useEffect(() => {
		const func = async () => {
			console.log("Initializing Apollo client");
			const client = await initApolloClient();
			setClient(client);
		};

		func();
	}, []);

	return (
		client && (
			<ApolloProvider client={client}>
				<Stack>
					<Stack.Screen name="home" options={{ headerShown: false }} />
				</Stack>
			</ApolloProvider>
		)
	);
}
