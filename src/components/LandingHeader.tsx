import { type Mode } from "./ModeNav";

interface HeaderProps {
  currentMode: Mode | "home";
  onSelectMode: (m: Mode | "home") => void;
}

export function LandingHeader({ currentMode, onSelectMode }: HeaderProps) {
  return (
    <header className="site-header">
      <div className="header-container">
        <div className="brand-logo" onClick={() => onSelectMode("home")} role="button" tabIndex={0}>
          <div className="logo-icon-glow">
            <span className="logo-symbol">🤟</span>
          </div>
          <div className="brand-text">
            <span className="brand-name">SignBridge</span>
            <span className="brand-badge">AI ACCESSIBILITY</span>
          </div>
        </div>

        <nav className="header-nav" aria-label="Main Navigation">
          <a href="#problem" className="nav-link" onClick={() => onSelectMode("home")}>
            Problem &amp; Impact
          </a>
          <a href="#features" className="nav-link" onClick={() => onSelectMode("home")}>
            Innovation
          </a>
          <a href="#live-demo" className="nav-link" onClick={() => onSelectMode("sign-to-sentence")}>
            Live Translator
          </a>
        </nav>

        <div className="header-actions">
          <button
            className="launch-demo-btn"
            onClick={() => onSelectMode("sign-to-sentence")}
          >
            <span>Launch Live App</span>
            <span className="btn-arrow">→</span>
          </button>
        </div>
      </div>
    </header>
  );
}
