/* client.mutate({
	mutation: ADD_TODO,
	variables: { text: "Comprar leche" },
	optimisticResponse: {
		__typename: "Mutation",
		addTodo: {
			__typename: "Todo",
			id: "temp-id",
			text: "Comprar leche",
		},
	},
});
 */
