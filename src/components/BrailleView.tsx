import { useState } from "react";
import { textToBraille } from "../lib/braille";

export function BrailleView() {
  const [text, setText] = useState("");

  return (
    <section aria-label="Text to Braille" className="braille-container">
      <div className="tool-card">
        <label htmlFor="braille-input" className="tool-label">Text to Translate</label>
        <textarea
          id="braille-input"
          className="tool-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type English text here to see real-time Braille translation..."
          rows={3}
        />
      </div>
      
      <div className="tool-card">
        <label className="tool-label">Braille Output</label>
        <div className="braille-display-box">
          <p className="braille-large-text" aria-label="Braille representation" lang="en">
            {textToBraille(text) || "⠼"}
          </p>
        </div>
        <p className="tool-hint">Visual pattern only — not a substitute for a refreshable braille display.</p>
      </div>
    </section>
  );
}
