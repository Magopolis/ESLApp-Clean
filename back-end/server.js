const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");

// Define GraphQL schema
const typeDefs = `
  type Query {
    greeting: String,
    exampleMessage: String
  }
`;

// Define resolvers
const resolvers = {
  Query: {
    greeting: () => "Hello! Welcome to the ESL App.",
    exampleMessage: () => "This is a new message!"
  }
};

// Create Apollo Server instance
const server = new ApolloServer({
  typeDefs,
  resolvers
});

// Start the server
async function startServer() {
  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 }
  });
  console.log(`🚀 Server ready at ${url}`);
}

startServer();
