import { ApolloClient, InMemoryCache } from "@apollo/client";

const client = new ApolloClient({
  uri: "http://localhost:4000", // Adjust this if your GraphQL server uses a different port
  cache: new InMemoryCache(),
});

export default client;
