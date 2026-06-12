import React, { useCallback, useEffect, useState, useRef } from "react";
import { gql, useMutation } from "@apollo/client";
import { fetchFromAPI } from "./apiService";
import Playground from "./Playground/Playground";
import Page3 from "./Playground/Page3";
import AskMiloPanel from "./AskMiloPanel";
import { speakText } from "./utils/speakText";

const LOG_TTS_SPEED = gql`
  mutation LogTtsSpeed($speedPercent: String!) {
    logAskMiloEvent(name: "tts_speed_changed", detail: $speedPercent) {
      id
    }
  }
`;

const AppContent = () => {
  const [view, setView] = useState("capsule");
  const [mode, setMode] = useState("cloud");
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [recording, setRecording] = useState(false);
  const [askMiloOpen, setAskMiloOpen] = useState(false);
  const [askMiloOpenSession, setAskMiloOpenSession] = useState(0);
  const [ttsSpeedPercent, setTtsSpeedPercent] = useState(100);
  const [logTtsSpeed] = useMutation(LOG_TTS_SPEED);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const highlightedTextRef = useRef("");

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
      return;
    }
if (service === "ollama") {
  const response = await fetchFromAPI({ service, model, input: prompt });
//const FullJSON = JSON.stringify(response, null, 2);
  console.log("📡 Sending LOCAL Mistral request:", model);
  if (typeof response === "string") {
    setOutput(response);
  } else {
    // Just show the response text, not the whole JSON
    console.log("📝 Local Mistral response: I am ", model);
    setOutput(response?.response || "No response.");
  }
  return; // Still safe to return here since Ollama is handled separately
}

    response = await fetchFromAPI({ service, input: prompt, model });

    if (service === "text-to-speech") {
      setAudioUrl(response.data?.synthesizeSpeech);
      return;
    }

    if (typeof response === "string") {
      setOutput(response);
      return;
    }

    if (response?.data?.ask) {
      setOutput(response.data.ask);
      return;
    }

    setOutput(JSON.stringify(response, null, 2));
  };

  const handleSpeakSelection = async () => {
    const selection = window.getSelection().toString().trim();
    if (!selection) {
      alert("Please highlight some text to speak.");
      return;
    }

    try {
      // TODO: Migrate selected-text speech from the backend /say route to frontend browser TTS.
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

  const getHighlightedText = () => {
    const activeElement = document.activeElement;
    const fieldSelection =
      ["INPUT", "TEXTAREA"].includes(activeElement?.tagName) &&
      typeof activeElement.selectionStart === "number"
        ? activeElement.value.slice(
            activeElement.selectionStart,
            activeElement.selectionEnd
          )
        : "";
    return (fieldSelection || window.getSelection().toString()).trim();
  };

  const speakHighlightedText = () => {
    const selection = getHighlightedText() || highlightedTextRef.current;

    if (!selection) {
      alert("Please highlight some text to speak.");
      return;
    }

    speakText(selection, { speedPercent: ttsSpeedPercent });
  };

  const changeTtsSpeed = (event) => {
    const newSpeedPercent = Number(event.target.value);
    setTtsSpeedPercent(newSpeedPercent);
    logTtsSpeed({ variables: { speedPercent: String(newSpeedPercent) } }).catch(
      (error) => console.error("Could not log TTS speed:", error)
    );
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

  const openAskMilo = useCallback(() => {
    setAskMiloOpenSession((current) => current + 1);
    setAskMiloOpen(true);
  }, []);

  useEffect(() => {
    const rememberHighlightedText = () => {
      const selection = getHighlightedText();
      if (selection) highlightedTextRef.current = selection;
    };

    document.addEventListener("selectionchange", rememberHighlightedText);
    return () =>
      document.removeEventListener("selectionchange", rememberHighlightedText);
  }, []);

  useEffect(() => {
    const handleAskMiloShortcut = (event) => {
      if (
        event.key.toLowerCase() === "m" &&
        !["INPUT", "TEXTAREA"].includes(event.target.tagName)
      ) {
        openAskMilo();
      }
    };

    window.addEventListener("keydown", handleAskMiloShortcut);
    return () => window.removeEventListener("keydown", handleAskMiloShortcut);
  }, [openAskMilo]);

  return (
    <div className="app-container">
      <aside className="global-tts-toolbar" aria-label="Highlighted text speech">
        <strong>Read highlighted text</strong>
        <button
          className="secondary-button"
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={speakHighlightedText}
        >
          Speak
        </button>
        <label className="tts-speed-control" htmlFor="global-tts-speed">
          <strong>Playback speed: {ttsSpeedPercent}%</strong>
          <input
            id="global-tts-speed"
            type="range"
            min="30"
            max="130"
            step="5"
            value={ttsSpeedPercent}
            onChange={changeTtsSpeed}
          />
          <span className="tts-speed-labels">
            <span>30% Slow</span>
            <span>100% Normal</span>
            <span>130% Fast</span>
          </span>
        </label>
      </aside>
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
          <button className="submit-button" onClick={openAskMilo}>
            Ask Milo (M)
          </button>
        </div>

        {askMiloOpen ? (
          <AskMiloPanel
            onClose={() => setAskMiloOpen(false)}
            openSession={askMiloOpenSession}
            ttsSpeedPercent={ttsSpeedPercent}
          />
        ) : view === "capsule" && (
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
              <button className="bar-button" onClick={() => handleAPICall("openai", "gpt-3.5-turbo")}>GPT-3.5</button>
              <button className="bar-button" onClick={() => handleAPICall("ollama", "mistral:7b-instruct-q4_0")}>mistral:7b-instruct-q4_0 (Local)</button>
              <button className="bar-button" onClick={() => handleAPICall("ollama", "mistral:instruct")}>Mistral:Instruct</button>
              <button className="bar-button" onClick={() => handleAPICall("ollama","mistral:latest")}>Mistral:Latest</button>
              <button className="bar-button" onClick={() => handleAPICall("huggingface")}>HF Model</button>
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
