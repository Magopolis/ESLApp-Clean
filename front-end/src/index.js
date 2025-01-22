import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Import ApolloProvider and the Apollo Client
import { ApolloProvider } from "@apollo/client";
import client from "./apolloClient"; // Adjust the path if necessary

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </React.StrictMode>
);
