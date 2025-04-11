🧠 Speech-to-Text (STT) — Final Working Setup

After exploring multiple STT and TTS systems (like Piper and Whisper), we decided to simplify for the MVP.

✅ Solution: gTTS for TTS (Text-to-Speech)

Library Used: gTTS (Google Text-to-Speech)

Reason: Dead simple, no Docker or missing dylib errors

How it works:

say.py takes dynamic text input

Uses gTTS to generate .mp3

Plays audio with afplay (macOS)

🛠️ How we call it

Express backend (server.js) route at /say:

app.post("/say", (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).send("No text provided");

  const safeText = text.replace(/"/g, '\\"');
  exec(`venv/bin/python back-end/say.py "${safeText}"`, (error, stdout, stderr) => {
    if (error) {
      console.error("Error:", error);
      return res.status(500).send("Failed to speak");
    }
    res.send("Spoken");
  });
});

🔪 How we test it:

curl -X POST http://localhost:5050/say \
  -H "Content-Type: application/json" \
  -d '{"text":"This is a test"}'

🧵 Lingering notes:

Piper is still installed but disabled due to libpiper_phonemize.1.dylib error

Whisper STT venv still available, but not currently active

Will revisit local solutions later when preparing for offline/local version