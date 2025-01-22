import React, { useState } from "react";
import { gql, useLazyQuery } from "@apollo/client";

// GraphQL query for `ask`
const ASK_QUERY = gql`
  query Ask($prompt: String!) {
    ask(prompt: $prompt)
  }
`;

const AppContent = () => {
  const [prompt, setPrompt] = useState("");
  const [fetchAsk, { data, loading, error }] = useLazyQuery(ASK_QUERY);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Trigger the ask query
    fetchAsk({ variables: { prompt } });
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
        {loading && <p>Loading...</p>}
        {error && <p>Error: {error.message}</p>}
        {data && <p>{data.ask}</p>}
      </div>
    </div>
  );
};

export default AppContent;
