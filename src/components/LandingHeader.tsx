import { type Mode } from "./ModeNav";

interface HeaderProps {
  currentMode: Mode | "home";
  onSelectMode: (m: Mode | "home") => void;
}

export function LandingHeader({ currentMode, onSelectMode }: HeaderProps) {
  return (
    <header className="site-header sb3d-header">
      <div className="header-container">
        {/* Brand Logo */}
        <div className="brand-logo sb3d-brand" onClick={() => onSelectMode("home")} role="button" tabIndex={0}>
          <div className="logo-icon-glow">
            <span className="logo-symbol">🤟</span>
          </div>
          <div className="brand-text">
            <span className="brand-name">SignBridge</span>
            <span className="brand-badge">AI ACCESSIBILITY</span>
          </div>
        </div>

        {/* Center nav pill — winterfell style */}
        <nav className="sb3d-nav-pill" aria-label="Main Navigation">
          <a href="#" className="sb3d-nav-link" onClick={(e) => { e.preventDefault(); onSelectMode("home"); }}>
            Overview
          </a>
          <a href="#features" className="sb3d-nav-link" onClick={() => onSelectMode("home")}>
            Innovation
          </a>
          <a href="#" className="sb3d-nav-link" onClick={(e) => { e.preventDefault(); onSelectMode("sign-to-sentence"); }}>
            Live Translator
          </a>
          <a href="#" className="sb3d-nav-link" onClick={(e) => { e.preventDefault(); onSelectMode("conversation"); }}>
            Conversation
          </a>
        </nav>

        {/* CTA Button */}
        <div className="header-actions">
          <button
            className="hp3d-btn-primary sb3d-header-cta"
            onClick={() => onSelectMode("sign-to-sentence")}
          >
            <span>Launch App</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
