# SignBridge — Operating Workflow

This is the **one source of truth** for how the app behaves. Read this before touching any
feature code. Every rule below exists to stop two features from fighting over the same
camera, microphone, buffered words, or screen-reader announcement — which is the failure
mode that makes multi-feature accessibility apps feel broken ("mash up").

---

## 1. The core rule: one Mode owns the device, always

The app is a **single state machine with six modes**, never more than one active at a time:

```
              ┌──────────────────────────────────────────────┐
              │                    App.tsx                    │
              │        mode: Mode  (exactly one value)         │
              └──────────────────────────────────────────────┘
                    │        │         │        │       │
        ┌───────────┘        │         │        │       └───────────┐
        ▼                    ▼         ▼        ▼                   ▼
 Sign→Sentence        Conversation  Describe  Sign      Braille   Settings
 (camera)             (camera+mic)  (camera)  Trainer   (none)    (none)
                                                (camera)
```

- Switching modes **unmounts** the previous mode's component.
- Every component that touches the camera uses the same `useCamera()` hook, whose cleanup
  effect calls `stream.getTracks().forEach(t => t.stop())` on unmount.
- Result: it is architecturally impossible for two modes to hold the camera or mic at the
  same time. You never need to "remember" to release a device — unmounting does it.

**Rule of thumb when adding a feature:** if it needs the camera or mic, it becomes a new
Mode (or lives inside an existing one's render tree) — it never runs as a background
service alongside another mode.

---

## 2. Layered pipeline per mode (so word logic and safety logic never mix)

Inside any mode that uses gesture recognition, frames flow through **four independent
layers**, each with one job and one file:

| Layer | File | Job | Never does |
|---|---|---|---|
| 1. Capture | `lib/mediapipeHands.ts` | Run MediaPipe HandLandmarker on the video frame → 21 raw (x,y,z) points | Interpret meaning |
| 2. Normalize | `lib/landmarks.ts` | Wrist-relative + scale-normalized 42-d vector | Know about words or safety |
| 3. Classify | `lib/classifier.ts` | Turn a vector into `{word, confidence, source}` (custom-trained gestures checked first, then built-in rule-based poses) | Buffer words or speak |
| 4a. Word buffering | mode component (e.g. `SignToSentence.tsx`) | Debounce repeated frames, push new words into a buffer | Run safety checks |
| 4b. Distress watch | `lib/emergency.ts` | A **separate, parallel** sustained-hold check (fist held 3s) | Read or write the word buffer |

Layer 4a and 4b both read from Layer 3's output in the same render loop, but they are two
independent functions with two independent pieces of state. This is deliberate: a normal
"stop" sign in the middle of a sentence must never accidentally arm the emergency alert,
and an emergency hold must never get treated as a vocabulary word. If you ever feel tempted
to check `if (word === "stop") maybeAlert()` — don't. Keep the distress check pose-based
and time-based, not vocabulary-based.

---

## 3. Data flow per feature (what calls what, in order)

### Sign → Sentence
1. `useCamera` → video element
2. `mediapipeHands.detectForVideo` every animation frame → landmarks
3. `classifier.classifyLandmarks` → word (deduped against the previous frame's word)
4. Word appended to local buffer, announced via `lib/announce.ts` for screen readers
5. On "Build sentence" (user-initiated, not automatic) → `llm.reconstructSentence(words,
   recentHistory)` → backend `/api/reconstruct` → Claude → one sentence back
6. Sentence spoken via `lib/speech.ts speak()`, buffer cleared, sentence appended to
   `history` (last 5 kept) so the next sentence has conversational context

### Two-Way Conversation
Runs **two loops in the same mode**, intentionally kept in two separate `useEffect`s so
neither depends on the other's internal state:
- **Loop A (hearing → non-hearing):** mic → `lib/speech.ts listen()` → final transcript →
  `llm.tagEmotion(transcript)` → backend `/api/emotion` → `{label, emoji}` → appended to
  the caption list and screen-reader announced
- **Loop B (non-hearing → hearing):** camera → same Capture/Normalize/Classify layers as
  above → word buffer → on button press → `reconstructSentence` → `speak()`

The two loops share the mode's UI but never share state directly — captions don't feed
into gesture recognition and vice versa. If you need them to reference each other (e.g.
using recent captions as LLM context for sentence reconstruction, which this build already
does), pass it explicitly as a function argument, never as shared mutable state.

### Describe My Surroundings
1. `useCamera` → single frame captured on button press via `lib/vision.ts captureFrame`
   (canvas snapshot, not a continuous loop — this mode does not run MediaPipe at all)
2. Base64 JPEG → backend `/api/describe` → Claude vision → two-sentence description
3. Description spoken via `speak()` and shown as text + screen-reader announced

This mode never loads the hand landmarker. Keeping it out entirely (rather than loading it
and just not using it) avoids wasting the WASM/GPU init cost and any risk of it firing
unexpectedly.

### Personal Sign Trainer
1. Same Capture → Normalize layers as Sign→Sentence, but classification is skipped
2. On "Capture sample," the **current** normalized vector is stored under the typed word
   via `lib/gestureStore.ts addSample()` (localStorage-backed)
3. After ~5 samples, that word is immediately available to `classifier.ts` — no separate
   training/build step, because classification is just cosine similarity against stored
   samples, checked before the built-in rule-based poses

### Emergency Distress Gesture
Isolated by design (see Section 2). `lib/emergency.ts DistressWatcher` holds its own
`holdStart`/`firedAt` timestamps, completely separate from `classifier.ts`'s word-dedup
state. It fires a UI confirmation dialog — **never** an automatic send — and only actually
posts to `/api/alert` after explicit user confirmation.

### Text → Braille
Pure function, no camera/mic, no LLM call. `lib/braille.ts` maps characters to Unicode
Braille Patterns synchronously. Kept as its own mode so it can never be accidentally wired
into the speech or gesture pipelines.

---

## 4. Screen-reader announcements: one live region, one function

All six modes should feel like one coherent app to a screen-reader user, not six different
apps stapled together. Every place that needs to speak to assistive tech calls the same
`lib/announce.ts announce(message)`, which writes to the single `#sr-live` region declared
once in `index.html` (outside the React tree, so it survives mode switches). Never create a
second `aria-live` region in a mode component — it will fight the shared one for the
screen-reader's attention.

---

## 5. Backend boundary: the browser never talks to the model directly

`server/index.js` is the only code that holds `ANTHROPIC_API_KEY` and calls the Anthropic
Messages API. The frontend only ever calls its own three routes:

- `POST /api/reconstruct` — words[] + history[] → sentence
- `POST /api/emotion` — transcript → {label, emoji}
- `POST /api/describe` — base64 image → description
- `POST /api/alert` — trusted contact + message → relay stub (wire to Twilio/SendGrid later)

This isn't just a security detail — it's what keeps `lib/llm.ts` and `lib/vision.ts` as
thin, swappable clients. If you change models or add response caching, it happens in one
file (`server/index.js`), and no frontend feature code needs to know.

---

## 6. Adding a new feature without breaking this

Checklist before writing code for anything new:
1. Does it need the camera or mic? → it's a new Mode (or lives fully inside one), never a
   background service that runs across modes.
2. Does it need gesture recognition? → reuse Capture → Normalize → Classify, don't fork a
   second landmark pipeline.
3. Does it need to talk to Claude? → add one route to `server/index.js`, one thin function
   to `lib/llm.ts` or a new `lib/*.ts`, never call the Anthropic API from a component.
4. Does it need to tell the user something out loud or to a screen reader? → `speak()` for
   audio, `announce()` for screen readers. Don't create new channels.
5. Would it ever run at the same time as another feature's camera/mic use? If yes, that's
   a design smell — make it its own Mode instead of layering it onto an existing one.
