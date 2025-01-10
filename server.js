import { Configuration, OpenAIApi } from 'openai';
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import 'dotenv/config';

const server = new ApolloServer({
  typeDefs: `#graphql
    type Query {
      hello: String
    }
    type Mutation {
      generateText(prompt: String!): String
    }
  `,    
  resolvers: {
    Query: {
      hello: () => 'Hello World!',
    },
    Mutation: {
      generateText: async (_, { prompt }) => {
        try {
          const configuration = new Configuration({
            apiKey: process.env.OPENAI_API_KEY,
          });
          const openai = new OpenAIApi(configuration);

          const response = await openai.createCompletion({
            model: 'text-davinci-003',
            prompt,
            max_tokens: 100,
          });

          return response.data.choices[0].text.trim();
        } catch (error) {
          console.error(error);
          throw new Error('Failed to generate text');
        }
      },
    },
  },
});

// Start the server
async function startServer() {
  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
  });
  console.log(`🚀 Server ready at ${url}`);
}

startServer();
