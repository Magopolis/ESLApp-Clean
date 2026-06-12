export const percentToRate = (speedPercent = 100) => {
  const numericPercent = Number(speedPercent);
  const safePercent = Number.isFinite(numericPercent) ? numericPercent : 100;

  return Math.min(1.3, Math.max(0.3, safePercent / 100));
};

export const speakText = (text, options = {}) => {
  if (!text || !window.speechSynthesis) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = percentToRate(options.speedPercent);
  utterance.onstart = options.onStart;
  utterance.onend = options.onEnd;
  utterance.onerror = options.onError;

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
};
