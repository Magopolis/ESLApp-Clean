// Placeholder scoring logic.
// We will replace this with embeddings next.

function scoreMeaning(text) {
  if (!text || text.length < 3) {
    return 10;
  }

  if (text.includes("?")) {
    return 60;
  }

  return Math.min(100, text.length * 5);
}

module.exports = { scoreMeaning };
