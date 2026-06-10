const { scoreMeaning } = require("./MeaningScorer");
const EventBus = require("./EventBus");

function handleSemanticInput({ sessionId, text }) {

  const meaningScore = scoreMeaning(text);

  let event;

  if (meaningScore < 50) {

    event = {
      type: "meaning.low",
      sessionId,
      text,
      meaningScore,
      reply: "I'm not sure what you mean. Can you rephrase?"
    };

  } else {

    event = {
      type: "meaning.high",
      sessionId,
      text,
      meaningScore,
      reply: "Understood."
    };

  }

  EventBus.emit(event.type, event);

  return event;
}

module.exports = { handleSemanticInput };
