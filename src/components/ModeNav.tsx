export type Mode =
  | "sign-to-sentence"
  | "conversation"
  | "describe"
  | "trainer"
  | "braille"
  | "settings";

const MODES: { id: Mode; label: string }[] = [
  { id: "sign-to-sentence", label: "Sign → Sentence" },
  { id: "conversation", label: "Two-Way Conversation" },
  { id: "describe", label: "Describe Surroundings" },
  { id: "trainer", label: "Teach a New Sign" },
  { id: "braille", label: "Text → Braille" },
  { id: "settings", label: "Emergency Contact" },
];

export function ModeNav({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <nav aria-label="App modes" className="mode-nav">
      <ul role="tablist" className="mode-nav-list">
        {MODES.map((m) => (
          <li key={m.id} role="presentation">
            <button
              role="tab"
              aria-selected={mode === m.id}
              className={mode === m.id ? "mode-btn active" : "mode-btn"}
              onClick={() => onChange(m.id)}
            >
              {m.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
