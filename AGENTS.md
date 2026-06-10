# ChatsTongue / ESLApp Agent Guide

## Project

- Project name: ChatsTongue / ESLApp
- Current branch: `feature/local-mistral`
- Frontend: React with Apollo Client
- Backend: Node.js with Apollo GraphQL

Read `docs/ESLAPP_CONTEXT.md` before making application changes.

## Important Rules

- Do not touch `back-end/semantic` unless the user explicitly asks.
- Do not use `git add .`.
- Keep code beginner-readable.
- Make the smallest working change.
- Do not add a database unless requested.
- Do not add new dependencies unless necessary.
- Preserve existing OpenAI, Mistral, STT, and TTS code unless the task explicitly
  asks to change it.

## Ask Milo

Ask Milo currently supports:

- Press `M` to open the panel.
- Spanish learner input and local intent detection.
- English target sentences and clickable chunk TTS.
- Adjacent chunk regrouping.
- Comprehension checks and answer feedback.
- Milo explanations with complete ordered explanation chunks.
- Playback speed controls.
- A Mac dictation placeholder for speaking a question.

Ask Milo version history:

- v0.1: Sentence Forge
- v0.2: Intent Bank
- v0.3: Milo Explanation Step
- v0.3.1: Full explanation chunking
- v0.4.1: Voice controls refinement

