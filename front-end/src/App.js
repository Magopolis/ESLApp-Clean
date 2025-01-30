import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { fetchFromAPI } from "./apiService.js"; // Import the unified API function

const AppContent = () => {
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");

  const handleAPICall = async (service, model = null) => {
    const response = await fetchFromAPI({ service, input: prompt, model });
    setOutput(JSON.stringify(response, null, 2)); // Display response nicely
  };

  return (
    <div className="app-container">
      <div className="main-content">
        <h1>ChatGotYourTongue</h1>
        <textarea
          placeholder="Ask me anything..."
          className="input-box"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        ></textarea>
        <button className="submit-button" onClick={() => handleAPICall("openai", "gpt-3.5-turbo")}>
          Ask AI (Short)
        </button>
        <textarea placeholder="Output goes here..." className="output-box" value={output} readOnly></textarea>
      </div>

      <div className="responsive-bar">
        <button className="bar-button" onClick={() => handleAPICall("openai", "gpt-4")}>GPT-4</button>
        <button className="bar-button" onClick={() => handleAPICall("huggingface")}>POS Tagging</button>
        <button className="bar-button" onClick={() => handleAPICall("pexels")}>Find Images</button>
        <button className="bar-button" onClick={() => handleAPICall("whisper")}>Transcribe Audio</button>
        <button className="bar-button" onClick={() => handleAPICall("text-to-speech")}>Read Aloud</button>
      </div>
    </div>
  );
};

export default AppContent;

