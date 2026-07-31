import { useState } from "react";
import { textToBraille } from "../lib/braille";

export function BrailleView() {
  const [text, setText] = useState("");

  return (
    <section aria-label="Text to Braille">
      <label htmlFor="braille-input">Text to convert</label>
      <textarea
        id="braille-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
      />
      <p className="braille-output" aria-label="Braille representation" lang="en">
        {textToBraille(text) || "(nothing yet)"}
      </p>
      <p className="hint">Visual pattern only — not a substitute for a refreshable braille display.</p>
    </section>
  );
}
