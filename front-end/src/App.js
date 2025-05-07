import React, { useState, useRef } from "react";
import { fetchFromAPI } from "./apiService";
import Playground from "./Playground/Playground";
import Page3 from "./Playground/Page3";

const AppContent = () => {
  const [view, setView] = useState("capsule");
  const [mode, setMode] = useState("cloud");
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const toggleMode = () =>
    setMode((prev) => (prev === "cloud" ? "local" : "cloud"));

  const toggleView = () => {
    setView((prev) =>
      prev === "capsule" ? "playground" :
      prev === "playground" ? "page3" :
      "capsule"
    );
  };

  const handleAPICall = async (service, model = null) => {
    let response;
    if (service === "whisper") {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
      response = await fetchFromAPI({ service, file: audioBlob });
      setOutput(response.data?.transcribeAudio || "");
    } else {
      response = await fetchFromAPI({ service, input: prompt, model });
      if (service === "text-to-speech") {
        setAudioUrl(response.data?.synthesizeSpeech);
      } else {
        setOutput(JSON.stringify(response, null, 2));
      }
    }
  };

  const handleSpeakSelection = async () => {
    const selection = window.getSelection().toString().trim();
    if (!selection) {
      alert("Please highlight some text to speak.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5050/say", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: selection }),
      });

      if (!response.ok) {
        console.error("❌ TTS server returned error");
      }
    } catch (err) {
      console.error("❌ TTS request failed:", err);
    }
  };

  const playAudio = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = () => {
        handleAPICall("whisper");
        audioChunksRef.current = [];
      };
      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (error) {
      console.error("Microphone access denied:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const clearInputs = () => {
    setPrompt("");
    setOutput("");
    setAudioUrl("");
  };

  return (
    <div className="app-container">
      <div className="main-content">
        <div style={{ display: "flex", gap: "10px", marginBottom: "1rem" }}>
          <button className="submit-button" onClick={() => handleAPICall("openai", "gpt-3.5-turbo")}>
            Ask AI (Short)
          </button>
          <button className="submit-button" onClick={toggleView}>
            Toggle View ({view})
          </button>
          <button className="submit-button" onClick={toggleMode}>
            Toggle Mode ({mode})
          </button>
        </div>

        {view === "capsule" && (
          <>
            <h1>hello world - ChatGotYourTongue</h1>
            <textarea
              placeholder="Ask me anything..."
              className="input-box"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            ></textarea>

            <div>
              <button className="record-button" onClick={recording ? stopRecording : startRecording}>
                {recording ? "Stop Recording" : "Start Recording"}
              </button>
            </div>

            <textarea
              placeholder="Output goes here..."
              className="output-box"
              value={output}
              readOnly
            ></textarea>

            <div className="responsive-bar">
              <button className="bar-button" onClick={() => handleAPICall("openai", "gpt-4")}>GPT-4</button>
              <button className="bar-button" onClick={() => handleAPICall("huggingface")}>POS Tagging</button>
              <button className="bar-button" onClick={() => handleAPICall("pexels")}>Find Images</button>
              <button className="bar-button" onClick={() => handleAPICall("whisper")}>Transcribe Audio</button>
              <button className="bar-button" onClick={() => handleAPICall("text-to-speech")}>Read Aloud</button>
            </div>

            {audioUrl && (
              <div>
                <audio controls src={audioUrl}></audio>
                <button onClick={playAudio}>Play Speech</button>
              </div>
            )}

            <button className="clear-button" onClick={clearInputs}>Clear All</button>
            <button onClick={handleSpeakSelection}>🔊 Speak Selection</button>
            <button onClick={playAudio}>▶️ Play</button>
          </>
        )}

        {view === "playground" && (
          <Playground
            prompt={prompt}
            setPrompt={setPrompt}
            output={output}
            setOutput={setOutput}
            audioUrl={audioUrl}
            setAudioUrl={setAudioUrl}
            recording={recording}
            setRecording={setRecording}
            mediaRecorderRef={mediaRecorderRef}
            audioChunksRef={audioChunksRef}
            handleAPICall={handleAPICall}
            interactionData={[]}
            addInteraction={() => {}}
          />
        )}

        {view === "page3" && <Page3 />}
      </div>
    </div>
  );
};

export default AppContent;
