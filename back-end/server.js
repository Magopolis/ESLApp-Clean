import dotenv from "dotenv";
dotenv.config();

import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { gql } from "graphql-tag";
import OpenAI from "openai";
import { exec } from "child_process";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

//const express = require("express");
//const { exec } = require("child_process");
const app = express();
const PORT = 5050;

app.use(express.json());

app.post("/say", (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).send("No text provided");

  // Safely pass text to Python
  const safeText = text.replace(/"/g, '\\"');
  const pythonPath = path.resolve(__dirname, "../venv/bin/python");
const scriptPath = path.resolve(__dirname, "say.py");

exec(`"${pythonPath}" "${scriptPath}" "${safeText}"`, (error, stdout, stderr) => {
  if (error) {
    console.error("Error:", error);
    return res.status(500).send("Failed to speak");
  }
  res.send("Spoken");
});
});

//app.listen(PORT, () => {
//  console.log(`Server running at http://localhost:${PORT}`);
//});

console.log("Using OpenAI API Key:", process.env.OPENAI_API_KEY);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: "org-1DrwsbbGWOpNoVMRrYgnO3vU", // optional
});
console.log("OpenAI client initialized.");

// Setup Express
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());


app.post("/speak", async (req, res) => {
  const text = req.body.prompt;

  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "No text provided" });
  }

  const userHome = process.env.HOME;
  const piperBin = `${userHome}/piper/piper`;
  const modelPath = `${userHome}/piper/models/en_US-lessac-medium.onnx`;
  const libPath = `${userHome}/piper`;
  const outputPath = path.join(__dirname, "audio/output.wav");
  const escapedText = text.replace(/"/g, '\\"');

  const command = `DYLD_LIBRARY_PATH=${libPath} ${piperBin} \
    --model ${modelPath} \
    --output_file "${outputPath}" \
    --text "${escapedText}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error("❌ Piper TTS error:", error);
      return res.status(500).json({ error: "TTS failed" });
    }

    return res.json({ audioUrl: "/audio/output.wav" });
  });
});



// GraphQL setup for Gralph
const typeDefs = gql`
  type Query {
    ask(prompt: String!, model: String!): String
  }
`;

const GralphWillNotBeIgnored = async (prompt, model) => {
  model = model || "gpt-3.5-turbo";
  console.log("🔍 Calling OpenAI with model:", model);

  const completion = await openai.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 100,
  });

  return completion.choices[0].message.content.trim();
};

const resolvers = {
  Query: {
    ask: async (_, { prompt, model }) => {
      try {
        console.log("🔍 Gralph received:", { prompt, model });
        return await GralphWillNotBeIgnored(prompt, model);
      } catch (error) {
        console.error("❌ OpenAI API Error:", error);
        return "An error occurred while processing your request.";
      }
    },
  },
};

// Start both servers
app.listen(PORT, () => {
  console.log(`✅ Express server ready at http://localhost:${PORT}`);
});


const server = new ApolloServer({ typeDefs, resolvers });
const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});
console.log(`🚀 GraphQL server ready at ${url}`);
