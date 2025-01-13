import React, { useState } from "react";
import { ApolloProvider, gql, useQuery } from "@apollo/client";
import client from "./apolloClient";

// Example GraphQL Query
const EXAMPLE_QUERY = gql`
  query {
    greeting
  }
`;

const GraphQLComponent = () => {
  const { loading, error, data } = useQuery(EXAMPLE_QUERY);

  if (loading) return <p>Loading greeting...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return <h2>Greeting from GraphQL: {data.greeting}</h2>;
};

const AppContent = () => {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      setResponse(data.response);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div>
      <h1>ChatGotYourTongue</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask me anything..."
        ></textarea>
        <button type="submit">Submit</button>
      </form>
      <div>
        <h2>Response:</h2>
        <p>{response}</p>
      </div>
      <GraphQLComponent />
    </div>
  );
};

const App = () => (
  <ApolloProvider client={client}>
    <AppContent />
  </ApolloProvider>
);

export default App;
