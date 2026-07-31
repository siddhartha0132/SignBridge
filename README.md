# SignBridge

AI accessibility companion: sign-to-sentence translation, two-way speech/sign conversation,
scene description for visually impaired users, a personal sign trainer, an emergency
distress gesture, and text-to-Braille. See **[`workflow.md`](./workflow.md)** for how the
app is architected internally — read that before modifying anything.

Gesture landmark detection uses Google's MediaPipe Hands running fully in the browser. The
normalization/scaling technique in `src/lib/landmarks.ts` is adapted from the Apache-2.0
licensed [hand-gesture-recognition-mediapipe](https://github.com/kinivi/hand-gesture-recognition-mediapipe)
reference project, reimplemented in TypeScript for client-side use.

**Powered by NVIDIA NIM API** - Using MiniMax-M3 model for fast, cost-effective LLM inference.

## Setup

```bash
npm install
cp .env.example .env   # then fill in NVIDIA_API_KEY (FREE TIER AVAILABLE!)
```

Get your free NVIDIA API key at: https://build.nvidia.com/

## Run (two processes: backend + frontend)

```bash
npm run dev:all
```

This starts the Express backend on `:8787` (holds your API key, proxies to Claude) and the
Vite dev server on `:5173` (proxies `/api/*` to the backend). Open `http://localhost:5173`.

Or run them separately:

```bash
npm run server   # terminal 1
npm run dev      # terminal 2
```

## Using it

- **Sign → Sentence**: allow camera access, hold a sign steadily, watch the word buffer
  fill up, press "Build sentence & speak."
- **Two-Way Conversation**: press "Start listening" for the hearing person's speech; sign
  in front of the camera for the non-hearing person's side.
- **Describe Surroundings**: point the camera and press the capture button.
- **Teach a New Sign**: type a word, hold a pose, capture 5 samples — it's usable
  immediately, no retraining step.
- **Text → Braille**: type text, see the Unicode Braille pattern rendered.
- **Emergency Contact**: set a trusted contact once; hold a closed fist for 3 seconds
  anywhere in the app to trigger the confirmation dialog.

## Built-in starter vocabulary (no training required)

`hello`, `stop`, `yes`, `please`, `wait`, `i-love-you` — recognized via a small geometric
finger-extension heuristic (see `src/lib/builtInGestures.ts`). This is intentionally a thin
starter set; use the Personal Sign Trainer to add real vocabulary for your demo.

## Known limitations (be upfront about these in your demo)

- The built-in gestures are static poses only — no motion, orientation, or non-manual
  markers, so it is **not** full ASL/ISL coverage.
- The distress alert endpoint (`/api/alert`) is a logging stub — wire it to Twilio/SendGrid
  for a real deployment.
- Emotion tagging classifies tone from the *transcript text*, not raw audio pitch/energy.
  For a stronger version, add a Web Audio `AnalyserNode` energy/pitch signal and blend it
  with the text-based label in `server/index.js /api/emotion`.
