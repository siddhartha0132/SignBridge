import { useState } from "react";
import { ModeNav, type Mode } from "./components/ModeNav";
import { SignToSentence } from "./components/SignToSentence";
import { Conversation } from "./components/Conversation";
import { DescribeSurroundings } from "./components/DescribeSurroundings";
import { SignTrainer } from "./components/SignTrainer";
import { BrailleView } from "./components/BrailleView";
import { EmergencyContactSetup } from "./components/EmergencyButton";

// ─────────────────────────────────────────────────────────────────────────
// THE CORE RULE: exactly one Mode is active at a time, and only the active
// mode's component is mounted. This is what prevents feature "mash up":
//   - the camera is only ever requested by whichever mode is mounted
//   - the mic is only ever requested by whichever mode is mounted
//   - the emergency distress watcher (see lib/emergency.ts) runs inside
//     any mode that has the camera, but it's a separate isolated check,
//     not mixed into that mode's own word/sentence logic
// Switching modes unmounts the previous one, which releases its camera/mic
// tracks via each component's own cleanup effect. See workflow.md for the
// full state-machine diagram and rationale.
// ─────────────────────────────────────────────────────────────────────────

export default function App() {
  const [mode, setMode] = useState<Mode>("sign-to-sentence");

  return (
    <div className="app">
      <header className="app-header">
        <h1>SignBridge</h1>
        <p className="tagline">Real-time AI companion for sign, speech, and sight</p>
      </header>

      <ModeNav mode={mode} onChange={setMode} />

      <main className="app-main" aria-label={`${mode} panel`}>
        {mode === "sign-to-sentence" && <SignToSentence />}
        {mode === "conversation" && <Conversation />}
        {mode === "describe" && <DescribeSurroundings />}
        {mode === "trainer" && <SignTrainer />}
        {mode === "braille" && <BrailleView />}
        {mode === "settings" && <EmergencyContactSetup />}
      </main>
    </div>
  );
}
