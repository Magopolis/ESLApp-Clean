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
    <div className="app-container">
      {/* Main Content */}
      <div className="main-content">
        <h1>ChatGotYourTongue</h1>
        <textarea placeholder="Ask me anything..." className="input-box"></textarea>
        <button className="submit-button">Submit</button>
        <textarea placeholder="output goes here..." className="output-box"></textarea>
      </div>

      {/* Sidebar/Bottom Bar */}
      <div className="responsive-bar">
        {Array.from({ length: 8 }, (_, index) => (
          <button key={index} className="bar-button">
            Button {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AppContent;
