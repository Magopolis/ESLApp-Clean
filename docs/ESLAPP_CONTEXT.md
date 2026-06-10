# ChatsTongue / ESLApp Context

## Project Overview

ChatsTongue / ESLApp is an interactive English-learning application. The
frontend uses React and Apollo Client. The backend uses Node.js and Apollo
GraphQL.

Current branch: `feature/local-mistral`

## Working Rules

- Do not touch `back-end/semantic` unless explicitly asked.
- Do not use `git add .`.
- Keep changes beginner-readable.
- Prefer the smallest working change.
- Do not add a database unless requested.
- Do not add new dependencies unless necessary.
- Do not remove or rewrite existing OpenAI, Mistral, STT, or TTS code unless
  the task requires it.

## Ask Milo Status

Ask Milo has developed through these versions:

- v0.1 Sentence Forge
- v0.2 Intent Bank
- v0.3 Milo Explanation Step
- v0.3.1 Full explanation chunking
- v0.4.1 Voice controls refinement

Current Ask Milo behavior:

- Press `M` to open the Ask Milo panel.
- Enter a question in Spanish.
- Detect a supported intent using a local intent bank.
- Display the matching English target sentence.
- Play target and explanation chunks with browser TTS.
- Select and regroup adjacent target chunks.
- Complete a comprehension check with loose answer matching.
- Ask Milo for a simple explanation after a correct comprehension answer.
- Display the full explanation as complete, ordered chunks.
- Change chunk playback speed with Slower, Normal, and Faster controls.
- Use a clear Mac dictation placeholder until real question transcription is
  available.
- Log Ask Milo interactions using the existing in-memory backend event logger.

## Future Feature Ideas

- Add a real `/transcribe` endpoint.
- Add Phrase Ladder / Whole Schmear practice.
- Add Visual Vocabulary Hover / Pexels support.
- Add a teacher dashboard and telemetry views.
- Add sentence analysis for parts of speech, noun orbits, and teaching targets.

## Coding Style

- Write code that a beginner can follow.
- Make the smallest working change that satisfies the request.
- Reuse existing patterns before introducing new abstractions.
- Avoid database persistence unless requested.
- Avoid new dependencies unless they are necessary.
- Preserve existing behavior while extending features.

