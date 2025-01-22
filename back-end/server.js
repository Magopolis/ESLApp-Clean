import "dotenv/config"; // Load environment variables
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { gql } from "graphql-tag";
import OpenAI from "openai";

// Initialize OpenAI Client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Replace with your API key
  organization: "org-1DrwsbbGWOpNoVMRrYgnO3vU", // Optional: replace with your organization ID
});

console.log("OpenAI client initialized:", openai);

const result = await openai.chat.completions.create({
  model: "gpt-3.5-turbo",
  messages: [{ role: "user", content: "Hello, world!" }],
});
console.log(result);

// GraphQL Type Definitions
const typeDefs = gql`
  type Query {
    greeting: String
    exampleMessage: String
    ask(prompt: String!): String
  }
`;

// GraphQL Resolvers
const resolvers = {
  Query: {
    greeting: () => "Hello! Welcome to the ESL App.",
    exampleMessage: () => "This is a new message!",
    ask: async (_, { prompt }) => {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 100,
        });
        return completion.choices[0].message.content.trim();
      } catch (error) {
        console.error("Error querying OpenAI:", error.message);
        return "An error occurred while processing your request.";
      }
    },
  },
};

// Create and Start Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`🚀 Server ready at ${url}`);
