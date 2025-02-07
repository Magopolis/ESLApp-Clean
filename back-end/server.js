import dotenv from "dotenv";
dotenv.config();

console.log("Using OpenAI API Key:", process.env.OPENAI_API_KEY);

import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { gql } from "graphql-tag";
import OpenAI from "openai";

// Initialize OpenAI Client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Replace with your API key
  organization: "org-1DrwsbbGWOpNoVMRrYgnO3vU", // Optional: replace with your organization ID
});
console.log("Using OpenAI API Key:", process.env.OPENAI_API_KEY);
console.log("OpenAI client initialized:", openai);



// GraphQL Type Definitions
const typeDefs = gql`
  type Query {
    ask(prompt: String!, model: String!): String  # 
  }
`;

// GraphQL Resolvers
// ✅ Hoisted Function: GralphWillNotBeIgnored()
const GralphWillNotBeIgnored = async (prompt, model) => {
  model = model || "gpt-3.5-turbo";  // ✅ Ensure model is always defined
  console.log("🔍 Calling OpenAI with model:", model);

  const completion = await openai.chat.completions.create({
    model: model,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 100,
  });

  return completion.choices[0].message.content.trim();
};

// ✅ Resolver Calls GralphWillNotBeIgnored()
const resolvers = {
  Query: {
    ask: async (_, { prompt, model }) => {  
      try {
        console.log("🔍 Gralph received:", { prompt, model });

        // ✅ Call the helper function instead of directly using OpenAI here
        return await GralphWillNotBeIgnored(prompt, model);
      } catch (error) {
        console.error("❌ OpenAI API Error:", error);
        return "An error occurred while processing your request.";
      }
    },
  },
};
const server = new ApolloServer({ typeDefs, resolvers });
const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`🚀 Server ready at ${url}`); // ✅ Now URL is defined

