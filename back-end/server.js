
import dotenv from "dotenv";
dotenv.config();
console.log("Using OpenAI API Key:", process.env.OPENAI_API_KEY);

import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { gql } from "graphql-tag";
import OpenAI from "openai";
import { exec } from "child_process";
import util from "util";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

// Disabled SSL certificate verification (dev only) — was needed temporarily to bypass local TLS errors
// Safe to remove unless connection issues return
// ⚠️ Never enable this in production — it's a security risk
//process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; 

// Initialize OpenAI Client

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Replace with your API key
  organization: "org-1DrwsbbGWOpNoVMRrYgnO3vU", // Optional: replace with your organization ID
});
console.log("Using OpenAI API Key:", process.env.OPENAI_API_KEY);
console.log("OpenAI client initialized:", openai);

// 🔍 Check if Piper is running before starting GraphQL server

const execAsync = util.promisify(exec);

const checkPiper = async () => {
  try {
    const { stdout } = await execAsync(
      'docker ps --filter "ancestor=rhasspy/wyoming-piper" --format "{{.ID}}"'
    );
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
};


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(cors());
app.use("/audio", express.static(path.join(__dirname, "audio")));

app.post("/speak", async (req, res) => {
  const text = req.body.prompt;

  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "No text provided" });
  }

  const outputPath = path.join(__dirname, "audio/output.wav");

  const dockerCommand = `docker run --rm -v $HOME/piper/models:/data rhasspy/wyoming-piper \
  --model /data/en_US-lessac-medium.onnx \
  --output_file /data/output.wav \
  --text "${text.replace(/"/g, '\\"')}"`;


  exec(dockerCommand, (error, stdout, stderr) => {
    if (error) {
      console.error("❌ Docker TTS error:", error);
      return res.status(500).json({ error: "TTS failed" });
    }

    // Copy output.wav to ./audio folder to serve it
    exec(`cp $HOME/piper/models/output.wav "${outputPath}"`, (copyErr) => {
      if (copyErr) {
        console.error("❌ Copy failed:", copyErr);
        return res.status(500).json({ error: "Copy failed" });
      }

      return res.json({ audioUrl: "/audio/output.wav" });
    });
  });
});

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

const piperRunning = await checkPiper();

if (!piperRunning) {
  console.warn("⚠️ Piper TTS is NOT running on port 50021.");
  console.warn("👉 You can start it with: ./ensure_piper.sh");
} else {
  console.log("✅ Piper TTS is running and ready.");
}
//start express along with Apollo
app.listen(3000, () => {
  console.log("✅ Express server ready at http://localhost:3000");
});

const server = new ApolloServer({ typeDefs, resolvers });
const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`🚀 Server ready at ${url}`); // ✅ Now URL is defined

