import React, { useEffect, useState } from "react";
import { gql, useMutation } from "@apollo/client";

const EXAMPLE_SPANISH =
  "¿Cómo funciona la devolución de autos de alquiler en el aeropuerto?";
const NO_INTENT_MESSAGE =
  "Milo tilts his head. Try asking about rental car returns, haber, or the bathroom for this demo.";

const INTENT_BANK = {
  rental_car_returns: {
    triggers: ["auto", "alquiler", "devolución", "rental car", "return"],
    target:
      "Milo, would you mind explaining to me how rental car returns work at the airport?",
    chunks: [
      "Milo",
      "would you mind",
      "explaining to me",
      "how rental car returns work",
      "at the airport",
    ],
    question: "What are you asking Milo to explain?",
    minimal: "How rental car returns work",
    good: "I am asking about rental car returns.",
    stretch:
      "I am asking Milo to explain how rental car returns work at the airport.",
    answerTriggers: ["rental car return", "car return"],
    explanation:
      "At an airport, you return a rental car at the rental car return area. You drive the car there. You park the car. You take your things. A worker checks the car. Then you finish the return.",
    explanationChunks: [
      "At an airport",
      "you return a rental car",
      "at the rental car return area",
      "You drive the car there",
      "You park the car",
      "You take your things",
      "A worker checks the car",
      "Then you finish the return",
    ],
    followupQuestion: "Where do you return the rental car?",
    followupAnswer: "rental car return area",
  },
  conjugate_haber: {
    triggers: ["haber", "conjuga", "conjugar", "verbo", "conjugate"],
    target: "Milo, would you mind explaining how to conjugate the verb haber?",
    chunks: [
      "Milo",
      "would you mind",
      "explaining",
      "how to conjugate",
      "the verb haber",
    ],
    question: "What verb are you asking Milo to explain?",
    minimal: "haber",
    good: "I am asking about the verb haber.",
    stretch:
      "I am asking about the verb haber. I would like Milo to explain how this verb is conjugated.",
    answerTriggers: ["haber"],
    explanation:
      "Haber is an important Spanish verb. It is often used as a helping verb. In the present tense, common forms are he, has, ha, hemos, and han.",
    explanationChunks: [
      "Haber is an important Spanish verb",
      "It is often used as a helping verb",
      "In the present tense",
      "common forms are he, has, ha, hemos, and han",
    ],
    followupQuestion: "What kind of verb is haber often used as?",
    followupAnswer: "helping verb",
  },
  find_bathroom: {
    triggers: ["baño", "bano", "bathroom", "restroom", "servicio", "toilet"],
    target: "Milo, where is the bathroom?",
    chunks: ["Milo", "where is", "the bathroom"],
    question: "What place are you asking for?",
    minimal: "bathroom",
    good: "I am asking where the bathroom is.",
    stretch: "I am asking Milo to tell me where the bathroom is.",
    answerTriggers: ["bathroom", "restroom", "toilet"],
    explanation:
      "To ask for the bathroom, say: Where is the bathroom? In an airport, you can also look for signs that say Restroom or Toilets.",
    explanationChunks: [
      "To ask for the bathroom, say",
      "Where is the bathroom",
      "In an airport",
      "you can also look for signs",
      "that say Restroom or Toilets",
    ],
    followupQuestion: "What sign might you look for?",
    followupAnswer: "restroom",
  },
};
const loggedOpenSessions = new Set();

const LOG_EVENT = gql`
  mutation LogAskMiloEvent($name: String!, $detail: String) {
    logAskMiloEvent(name: $name, detail: $detail) {
      id
    }
  }
`;

const normalizeAnswer = (answer) =>
  answer
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[?.!]+$/, "");

const detectIntent = (sourceQuestion) => {
  const normalizedQuestion = normalizeAnswer(sourceQuestion);

  return Object.entries(INTENT_BANK).find(([, intent]) =>
    intent.triggers.some((trigger) =>
      normalizedQuestion.includes(normalizeAnswer(trigger))
    )
  );
};

const AskMiloPanel = ({ onClose, openSession }) => {
  const [sourceQuestion, setSourceQuestion] = useState(EXAMPLE_SPANISH);
  const [activeIntent, setActiveIntent] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [selectedIndexes, setSelectedIndexes] = useState([]);
  const [sentenceShown, setSentenceShown] = useState(false);
  const [noIntentMessage, setNoIntentMessage] = useState("");
  const [showComprehension, setShowComprehension] = useState(false);
  const [answer, setAnswer] = useState("");
  const [answerFeedback, setAnswerFeedback] = useState("");
  const [comprehensionCorrect, setComprehensionCorrect] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [followupAnswer, setFollowupAnswer] = useState("");
  const [followupFeedback, setFollowupFeedback] = useState("");
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

    const detectedIntent = detectIntent(sourceQuestion);

    log("source_question_entered", sourceQuestion.trim());
    setSelectedIndexes([]);
    setShowComprehension(false);
    setAnswer("");
    setAnswerFeedback("");
    setComprehensionCorrect(false);
    setShowExplanation(false);
    setFollowupAnswer("");
    setFollowupFeedback("");

    if (!detectedIntent) {
      setActiveIntent(null);
      setChunks([]);
      setSentenceShown(false);
      setNoIntentMessage(NO_INTENT_MESSAGE);
      return;
    }

    const [intentName, intent] = detectedIntent;
    setActiveIntent(intent);
    setChunks(intent.chunks);
    setSentenceShown(true);
    setNoIntentMessage("");
    log("detected_intent", intentName);
    log("target_sentence_shown", intent.target);
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
    log("full_sentence_record_clicked", activeIntent.target);
  };

  const submitAnswer = (event) => {
    event.preventDefault();
    const normalizedAnswer = normalizeAnswer(answer);
    const isCorrect = activeIntent.answerTriggers.some((trigger) =>
      normalizedAnswer.includes(normalizeAnswer(trigger))
    );
    setAnswerFeedback(isCorrect ? "Correct!" : "Try again.");
    setComprehensionCorrect(isCorrect);
    log(
      "comprehension_answer_submitted",
      JSON.stringify({ answer: answer.trim(), correct: isCorrect })
    );
  };

  const showMiloExplanation = () => {
    setShowExplanation(true);
    log("ask_milo_now_clicked", activeIntent.target);
    log("milo_explanation_shown", activeIntent.explanation);
  };

  const speakExplanationChunk = (chunk) => {
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(chunk));
    log("explanation_chunk_tts_clicked", chunk);
  };

  const submitFollowupAnswer = (event) => {
    event.preventDefault();
    const isCorrect = normalizeAnswer(followupAnswer).includes(
      normalizeAnswer(activeIntent.followupAnswer)
    );
    setFollowupFeedback(isCorrect ? "Correct!" : "Try again.");
    log(
      "explanation_followup_submitted",
      JSON.stringify({ answer: followupAnswer.trim(), correct: isCorrect })
    );
  };

  return (
    <section className="ask-milo-panel" aria-labelledby="ask-milo-title">
      <div className="ask-milo-heading">
        <div>
          <p className="ask-milo-eyebrow">Explanation Step v0.3</p>
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

      {noIntentMessage && <p className="practice-hint">{noIntentMessage}</p>}

      {sentenceShown && (
        <div className="sentence-practice">
          <h3>Target English</h3>
          <p className="target-sentence">{activeIntent.target}</p>
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
            <p>{activeIntent.target}</p>
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
          <label htmlFor="comprehension-answer">{activeIntent.question}</label>
          <input
            id="comprehension-answer"
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
          />
          <button className="submit-button" type="submit">
            Check answer
          </button>
          {answerFeedback && <p className="answer-feedback">{answerFeedback}</p>}
          {answerFeedback && (
            <div>
              <p>
                <strong>Minimal:</strong> {activeIntent.minimal}
              </p>
              <p>
                <strong>Good:</strong> {activeIntent.good}
              </p>
              <p>
                <strong>Stretch:</strong> {activeIntent.stretch}
              </p>
            </div>
          )}
          {comprehensionCorrect && !showExplanation && (
            <button
              className="submit-button"
              type="button"
              onClick={showMiloExplanation}
            >
              Ask Milo Now
            </button>
          )}
        </form>
      )}

      {showExplanation && (
        <section className="comprehension-card">
          <h3>Milo explains</h3>
          <p>{activeIntent.explanation}</p>

          <h4>Useful chunks</h4>
          <div className="chunk-list">
            {activeIntent.explanationChunks.map((chunk) => (
              <button
                className="chunk-speak-button"
                type="button"
                key={chunk}
                onClick={() => speakExplanationChunk(chunk)}
              >
                {chunk}
              </button>
            ))}
          </div>

          <form onSubmit={submitFollowupAnswer}>
            <label htmlFor="explanation-followup">
              {activeIntent.followupQuestion}
            </label>
            <input
              id="explanation-followup"
              value={followupAnswer}
              onChange={(event) => setFollowupAnswer(event.target.value)}
            />
            <button className="submit-button" type="submit">
              Check follow-up
            </button>
            {followupFeedback && (
              <p className="answer-feedback">{followupFeedback}</p>
            )}
          </form>
        </section>
      )}
    </section>
  );
};

export default AskMiloPanel;
