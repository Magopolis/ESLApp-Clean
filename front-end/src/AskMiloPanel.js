import React, { useEffect, useState } from "react";
import { gql, useLazyQuery, useMutation } from "@apollo/client";
import { speakText } from "./utils/speakText";

const INPUT_LANGUAGES = [
  {
    value: "en",
    label: "English",
    placeholder: "Ask a question in English",
  },
  {
    value: "fr",
    label: "Français",
    placeholder: "Pose une question en français",
  },
  {
    value: "es",
    label: "Español",
    placeholder: "Haz una pregunta en español",
  },
];

const loggedOpenSessions = new Set();

const FORGE_TARGET_ENGLISH = gql`
  query ForgeAskMiloTarget($prompt: String!, $model: String) {
    ask(prompt: $prompt, model: $model)
  }
`;

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

const splitIntoChunks = (sentence) =>
  sentence
    .split(/(?<=[.!?])\s+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

const splitIntoWordTokens = (sentence) =>
  sentence.trim().split(/\s+/).filter(Boolean);

const buildForgedSentence = (target) => {
  return {
    target,
    chunks: splitIntoWordTokens(target),
    question: "What are you asking Milo to help with?",
    minimal: "English phrasing",
    good: "I am asking Milo for help saying my question in English.",
    stretch:
      "I am asking Milo to help turn my question into useful English phrasing.",
    answerTriggers: ["english", "phrasing", "question"],
    explanation: target,
    explanationChunks: splitIntoChunks(target),
    followupQuestion: "What language do you want help using?",
    followupAnswer: "English",
  };
};

const buildForgePrompt = (input, language) => `
You are Milo, an English sentence coach.
Convert the learner's input into one natural, concise English sentence or question.
Return only the target English sentence.
Do not explain.
Do not mention alternatives.

Learner input language: ${language || "unknown"}
Learner input: ${input}
`;

const AskMiloPanel = ({
  onClose,
  openSession,
  ttsSpeedPercent,
  playingTtsText,
  onTtsStart,
  onTtsEnd,
}) => {
  const [sourceQuestion, setSourceQuestion] = useState("");
  const [inputLanguage, setInputLanguage] = useState("es");
  const [activeIntent, setActiveIntent] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [selectedIndexes, setSelectedIndexes] = useState([]);
  const [sentenceShown, setSentenceShown] = useState(false);
  const [showComprehension, setShowComprehension] = useState(false);
  const [answer, setAnswer] = useState("");
  const [answerFeedback, setAnswerFeedback] = useState("");
  const [comprehensionCorrect, setComprehensionCorrect] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [followupAnswer, setFollowupAnswer] = useState("");
  const [followupFeedback, setFollowupFeedback] = useState("");
  const [voiceMessage, setVoiceMessage] = useState("");
  const [logEvent] = useMutation(LOG_EVENT);
  const [forgeTargetEnglish, { loading: forgeLoading }] = useLazyQuery(
    FORGE_TARGET_ENGLISH,
    {
      fetchPolicy: "no-cache",
    }
  );

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

  const showTargetSentence = async (event) => {
    event.preventDefault();
    if (!sourceQuestion.trim()) return;

    log("source_question_entered", sourceQuestion.trim());
    setSelectedIndexes([]);
    setShowComprehension(false);
    setAnswer("");
    setAnswerFeedback("");
    setComprehensionCorrect(false);
    setShowExplanation(false);
    setFollowupAnswer("");
    setFollowupFeedback("");
    setActiveIntent(null);
    setChunks([]);
    setSentenceShown(false);

    try {
      const response = await forgeTargetEnglish({
        variables: {
          prompt: buildForgePrompt(sourceQuestion.trim(), inputLanguage),
          model: "gpt-3.5-turbo",
        },
      });
      const target = response.data?.ask?.trim();

      if (!target) {
        throw new Error("Ask Milo did not return a target sentence.");
      }

      const forgedSentence = buildForgedSentence(target);
      setActiveIntent(forgedSentence);
      setChunks(forgedSentence.chunks);
      setSentenceShown(true);
      log("target_sentence_shown", forgedSentence.target);
    } catch (error) {
      console.error("Could not forge Ask Milo sentence:", error);
      setActiveIntent(null);
      setChunks([]);
      setSentenceShown(false);
    }
  };

  const speakAndLog = (text, eventName) => {
    onTtsStart(text);
    speakText(text, {
      speedPercent: ttsSpeedPercent,
      onStart: () => onTtsStart(text),
      onEnd: onTtsEnd,
      onError: onTtsEnd,
    });
    log(eventName, text);
  };

  const speakChunk = (chunk) => {
    speakAndLog(chunk, "chunk_tts_clicked");
  };

  const speakQuestion = () => {
    setVoiceMessage("Use Mac dictation for now.");
    log("speak_question_clicked");
  };

  const selectedInputLanguage = INPUT_LANGUAGES.find(
    (language) => language.value === inputLanguage
  );

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
    speakAndLog(chunk, "explanation_chunk_tts_clicked");
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
          <p className="ask-milo-eyebrow">TTS Feedback Polish v0.4.4</p>
          <h2 id="ask-milo-title">Ask Milo</h2>
        </div>
        <button className="secondary-button" type="button" onClick={onClose}>
          Close
        </button>
      </div>

      <form onSubmit={showTargetSentence}>
        <label htmlFor="milo-source-question">Ask a question in Spanish</label>
        <div className="ask-milo-language-buttons" aria-label="Input language">
          {INPUT_LANGUAGES.map((language) => (
            <button
              className={`ask-milo-language-button ${
                inputLanguage === language.value ? "is-selected" : ""
              }`}
              type="button"
              key={language.value}
              aria-pressed={inputLanguage === language.value}
              onClick={() => setInputLanguage(language.value)}
            >
              {language.label}
            </button>
          ))}
        </div>
        <textarea
          id="milo-source-question"
          className="ask-milo-input"
          lang={inputLanguage}
          placeholder={selectedInputLanguage.placeholder}
          value={sourceQuestion}
          onChange={(event) => setSourceQuestion(event.target.value)}
        />
        <button className="secondary-button" type="button" onClick={speakQuestion}>
          Speak question
        </button>
        {voiceMessage && <p className="practice-hint">{voiceMessage}</p>}
        <button
          className="submit-button"
          type="submit"
          disabled={forgeLoading || !sourceQuestion.trim()}
        >
          {forgeLoading ? "Forging..." : "Forge sentence"}
        </button>
      </form>

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
                  className={`chunk-speak-button ${
                    playingTtsText === chunk ? "is-playing" : ""
                  }`}
                  type="button"
                  disabled={Boolean(playingTtsText)}
                  onClick={() => speakChunk(chunk)}
                >
                  {playingTtsText === chunk ? `Playing: ${chunk}` : chunk}
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
                className={`chunk-speak-button ${
                  playingTtsText === chunk ? "is-playing" : ""
                }`}
                type="button"
                key={chunk}
                disabled={Boolean(playingTtsText)}
                onClick={() => speakExplanationChunk(chunk)}
              >
                {playingTtsText === chunk ? `Playing: ${chunk}` : chunk}
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
