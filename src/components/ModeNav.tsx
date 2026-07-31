export type Mode =
  | "home"
  | "features"
  | "sign-to-sentence"
  | "conversation"
  | "describe"
  | "trainer"
  | "braille"
  | "settings";

const MODES: { id: Mode; label: string; icon: string }[] = [
  { id: "home", label: "Home", icon: "🏠" },
  { id: "features", label: "All Features", icon: "✨" },
  { id: "sign-to-sentence", label: "Sign → Sentence", icon: "🖐️" },
  { id: "conversation", label: "Two-Way Conversation", icon: "🗣️" },
  { id: "describe", label: "Describe Surroundings", icon: "👁️" },
  { id: "trainer", label: "Teach a New Sign", icon: "🎓" },
  { id: "braille", label: "Text → Braille", icon: "⠃" },
  { id: "settings", label: "Emergency Contact", icon: "🚨" },
];

export function ModeNav({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <nav aria-label="App modes" className="mode-nav-wrapper">
      <div className="mode-nav-container">
        <ul role="tablist" className="mode-nav-list">
          {MODES.map((m) => (
            <li key={m.id} role="presentation">
              <button
                role="tab"
                aria-selected={mode === m.id}
                className={mode === m.id ? "mode-btn active" : "mode-btn"}
                onClick={() => onChange(m.id)}
              >
                <span className="mode-icon" aria-hidden="true">{m.icon}</span>
                <span>{m.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
