import React, { useEffect, useState } from "react";
import { gql, useMutation } from "@apollo/client";

const EXAMPLE_SPANISH =
  "¿Cómo funciona la devolución de autos de alquiler en el aeropuerto?";
const TARGET_ENGLISH =
  "Milo, would you mind explaining to me how rental car returns work at the airport?";
const INITIAL_CHUNKS = [
  "Milo",
  "would you mind",
  "explaining",
  "to me",
  "how rental car",
  "returns work",
  "at the airport",
];
const ACCEPTED_ANSWER = "How rental car returns work";
const loggedOpenSessions = new Set();

const LOG_EVENT = gql`
  mutation LogAskMiloEvent($name: String!, $detail: String) {
    logAskMiloEvent(name: $name, detail: $detail) {
      id
    }
  }
`;

const normalizeAnswer = (answer) =>
  answer.trim().toLowerCase().replace(/[?.!]+$/, "");

const AskMiloPanel = ({ onClose, openSession }) => {
  const [sourceQuestion, setSourceQuestion] = useState(EXAMPLE_SPANISH);
  const [chunks, setChunks] = useState(INITIAL_CHUNKS);
  const [selectedIndexes, setSelectedIndexes] = useState([]);
  const [sentenceShown, setSentenceShown] = useState(false);
  const [showComprehension, setShowComprehension] = useState(false);
  const [answer, setAnswer] = useState("");
  const [answerFeedback, setAnswerFeedback] = useState("");
  const [logEvent] = useMutation(LOG_EVENT);

  const log = (name, detail) => {
    logEvent({ variables: { name, detail } }).catch((error) => {
      console.error("Could not log Ask Milo event:", error);
    });
  };

  useEffect(() => {
    if (!loggedOpenSessions.has(openSession)) {
      loggedOpenSessions.add(openSession);
      log("ask_milo_opened");
    }
  }, [openSession]);

  const showTargetSentence = (event) => {
    event.preventDefault();
    if (!sourceQuestion.trim()) return;

    setChunks(INITIAL_CHUNKS);
    setSelectedIndexes([]);
    setSentenceShown(true);
    setShowComprehension(false);
    setAnswerFeedback("");
    log("source_question_entered", sourceQuestion.trim());
    log("target_sentence_shown", TARGET_ENGLISH);
  };

  const speakChunk = (chunk) => {
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(chunk));
    log("chunk_tts_clicked", chunk);
  };

  const toggleChunkSelection = (index) => {
    setSelectedIndexes((current) =>
      current.includes(index)
        ? current.filter((selectedIndex) => selectedIndex !== index)
        : [...current, index].sort((a, b) => a - b)
    );
  };

  const selectedChunksAreAdjacent =
    selectedIndexes.length >= 2 &&
    selectedIndexes.every(
      (index, position) =>
        position === 0 || index === selectedIndexes[position - 1] + 1
    );

  const mergeSelectedChunks = () => {
    if (!selectedChunksAreAdjacent) return;

    const firstIndex = selectedIndexes[0];
    const selectedSet = new Set(selectedIndexes);
    const mergedChunk = selectedIndexes.map((index) => chunks[index]).join(" ");
    const regroupedChunks = chunks.flatMap((chunk, index) => {
      if (index === firstIndex) return [mergedChunk];
      return selectedSet.has(index) ? [] : [chunk];
    });

    setChunks(regroupedChunks);
    setSelectedIndexes([]);
    log("chunks_regrouped", JSON.stringify(regroupedChunks));
  };

  const recordChunk = (chunk) => {
    log("chunk_record_clicked", chunk);
  };

  const practiceFullSentence = () => {
    setShowComprehension(true);
    log("full_sentence_record_clicked", TARGET_ENGLISH);
  };

  const submitAnswer = (event) => {
    event.preventDefault();
    const isCorrect =
      normalizeAnswer(answer) === normalizeAnswer(ACCEPTED_ANSWER);
    setAnswerFeedback(isCorrect ? "Correct!" : "Try again.");
    log(
      "comprehension_answer_submitted",
      JSON.stringify({ answer: answer.trim(), correct: isCorrect })
    );
  };

  return (
    <section className="ask-milo-panel" aria-labelledby="ask-milo-title">
      <div className="ask-milo-heading">
        <div>
          <p className="ask-milo-eyebrow">Sentence Forge v0.1</p>
          <h2 id="ask-milo-title">Ask Milo</h2>
        </div>
        <button className="secondary-button" type="button" onClick={onClose}>
          Close
        </button>
      </div>

      <form onSubmit={showTargetSentence}>
        <label htmlFor="milo-source-question">Ask a question in Spanish</label>
        <textarea
          id="milo-source-question"
          className="ask-milo-input"
          value={sourceQuestion}
          onChange={(event) => setSourceQuestion(event.target.value)}
        />
        <button className="submit-button" type="submit">
          Forge sentence
        </button>
      </form>

      {sentenceShown && (
        <div className="sentence-practice">
          <h3>Target English</h3>
          <p className="target-sentence">{TARGET_ENGLISH}</p>
          <p className="practice-hint">
            Click a chunk to hear it. Select adjacent chunks to regroup them.
          </p>

          <div className="chunk-list">
            {chunks.map((chunk, index) => (
              <div className="chunk-card" key={`${chunk}-${index}`}>
                <button
                  className="chunk-speak-button"
                  type="button"
                  onClick={() => speakChunk(chunk)}
                >
                  {chunk}
                </button>
                <label className="chunk-select-label">
                  <input
                    type="checkbox"
                    checked={selectedIndexes.includes(index)}
                    onChange={() => toggleChunkSelection(index)}
                  />
                  Select
                </label>
                <button
                  className="record-button"
                  type="button"
                  onClick={() => recordChunk(chunk)}
                >
                  Record
                </button>
              </div>
            ))}
          </div>

          <button
            className="secondary-button"
            type="button"
            disabled={!selectedChunksAreAdjacent}
            onClick={mergeSelectedChunks}
          >
            Merge selected chunks
          </button>

          <div className="full-sentence-practice">
            <p>{TARGET_ENGLISH}</p>
            <button
              className="record-button"
              type="button"
              onClick={practiceFullSentence}
            >
              Record full sentence
            </button>
          </div>
        </div>
      )}

      {showComprehension && (
        <form className="comprehension-card" onSubmit={submitAnswer}>
          <label htmlFor="comprehension-answer">
            What are you asking Milo to explain?
          </label>
          <input
            id="comprehension-answer"
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
          />
          <button className="submit-button" type="submit">
            Check answer
          </button>
          {answerFeedback && <p className="answer-feedback">{answerFeedback}</p>}
        </form>
      )}
    </section>
  );
};

export default AskMiloPanel;
