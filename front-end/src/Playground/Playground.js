// src/playground/Playground.js

import React, { useState } from "react";
import "./playground.css"; // optional if you want separate styling

const Playground = ({
  interactionData,
  addInteraction,
  prompt,
  setPrompt,
  output,
  setOutput,
  audioUrl,
  setAudioUrl,
  recording,
  setRecording,
  mediaRecorderRef,
  audioChunksRef
}) => {
  const [chat, setChat] = useState([]);

  const handleSend = () => {
    if (!prompt.trim()) return;
    const userMessage = { from: "user", text: prompt };

    // 🔥 You can later route this to the appropriate green-lit model here
    const fakeReply = {
      from: "gpt4o",
      text: `This is a stubbed reply to: "${prompt}"`
    };

    setChat([...chat, userMessage, fakeReply]);
    setPrompt(""); // clear prompt field
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div className="playground-container">
      <div className="left-column">
        <h1>🎉 GPTPartyRoom 🎉</h1>
        <p>This is Bob Dole's Playground. Don’t sit on the swingset.</p>
        <img
          src="https://via.placeholder.com/300x150"
          alt="placeholder1"
          style={{ marginBottom: "1rem" }}
        />
        {/* More content placeholders can go here */}
      </div>

      <div className="right-column">
        <div className="chat-log">
          {chat.map((msg, i) => (
            <div key={i} className={`chat-bubble from-${msg.from}`}>
              {msg.text}
            </div>
          ))}
        </div>
        <div className="chat-input">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
          />
          <button onClick={handleSend}>Send</button>
        </div>
      </div>
    </div>
  );
};

export default Playground;
