import { type Mode } from "./ModeNav";

interface FeaturesPageProps {
  onSelectFeature: (mode: Mode) => void;
  onBack: () => void;
}

const FEATURES = [
  {
    id: "sign-to-sentence" as Mode,
    icon: "🖐️",
    title: "Sign → Sentence Translator",
    tagline: "AI-POWERED · REAL-TIME",
    desc: "Translates raw hand gestures in real-time into fluid, grammatically complete spoken sentences via high-quality TTS.",
    color: "#06b6d4",
    glow: "rgba(6,182,212,0.35)",
    stat: "< 1.2s Latency",
    tag: "Most Popular",
  },
  {
    id: "conversation" as Mode,
    icon: "🗣️",
    title: "Two-Way Conversation",
    tagline: "EMOTION-AWARE · LIVE",
    desc: "Live microphone speech-to-text with real-time sentiment analysis tagging emotional tone alongside live captions.",
    color: "#10b981",
    glow: "rgba(16,185,129,0.35)",
    stat: "Emotion Aware",
    tag: null,
  },
  {
    id: "describe" as Mode,
    icon: "👁️",
    title: "Surroundings Sight Companion",
    tagline: "VISION AI · SAFETY",
    desc: "AI vision analysis captures webcam snapshots and provides spoken descriptions of obstacles, people, and hazards.",
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.35)",
    stat: "Scene Analysis",
    tag: null,
  },
  {
    id: "trainer" as Mode,
    icon: "🎓",
    title: "Custom Sign Trainer",
    tagline: "BROWSER NATIVE · CUSTOM",
    desc: "Empower users to teach the system custom sign language gestures right in the browser without re-training models.",
    color: "#ec4899",
    glow: "rgba(236,72,153,0.35)",
    stat: "Browser Native",
    tag: null,
  },
  {
    id: "braille" as Mode,
    icon: "⠃",
    title: "Text → Braille Translator",
    tagline: "TACTILE · GRADE-1",
    desc: "Instant bidirectional translation between text and Unicode Braille characters with tactile reference guides.",
    color: "#a855f7",
    glow: "rgba(168,85,247,0.35)",
    stat: "Grade-1 Braille",
    tag: null,
  },
  {
    id: "settings" as Mode,
    icon: "🚨",
    title: "Emergency SOS Sentinel",
    tagline: "LIFESAVING · INSTANT",
    desc: "Detects a 3-second held fist gesture independently and triggers an instant emergency alert to trusted contacts.",
    color: "#f43f5e",
    glow: "rgba(244,63,94,0.35)",
    stat: "3-Second Trigger",
    tag: "Safety",
  },
];

export function FeaturesPage({ onSelectFeature, onBack }: FeaturesPageProps) {
  return (
    <div className="fp-root">
      {/* Back nav */}
      <div className="fp-back-bar">
        <button className="fp-back-btn" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          <span>Back to Home</span>
        </button>
        <div className="fp-breadcrumb">
          <span className="fp-breadcrumb-home" onClick={onBack}>SignBridge</span>
          <span className="fp-breadcrumb-sep">/</span>
          <span className="fp-breadcrumb-current">Choose Feature</span>
        </div>
      </div>

      {/* Header */}
      <div className="fp-header">
        <div className="fp-header-pill">
          <span className="fp-pill-dot" />
          <span>6 AI-POWERED ACCESSIBILITY MODULES</span>
        </div>
        <h1 className="fp-h1">
          Choose Your <span className="fp-h1-accent">Experience</span>
        </h1>
        <p className="fp-subtitle">
          Select a module to launch the live interactive playground. Each feature is independently
          powered by a dedicated AI pipeline.
        </p>
      </div>

      {/* Feature Cards Grid */}
      <div className="fp-grid">
        {FEATURES.map((f, i) => (
          <button
            key={f.id}
            className="fp-card"
            style={{
              "--fp-color": f.color,
              "--fp-glow": f.glow,
              animationDelay: `${i * 0.07}s`,
            } as React.CSSProperties}
            onClick={() => onSelectFeature(f.id)}
          >
            {/* Tag */}
            {f.tag && (
              <div className="fp-card-tag" style={{ background: f.color + "20", color: f.color, borderColor: f.color + "40" }}>
                {f.tag}
              </div>
            )}

            {/* Glow sweep */}
            <div className="fp-card-glow" />

            {/* Top row */}
            <div className="fp-card-top">
              <div className="fp-icon-wrap" style={{ background: f.color + "18", boxShadow: `0 8px 28px ${f.glow}` }}>
                <span className="fp-icon">{f.icon}</span>
              </div>
              <div className="fp-card-dot-wrap">
                <div className="fp-card-dot" style={{ background: f.color, boxShadow: `0 0 10px ${f.color}` }} />
                <span className="fp-tagline" style={{ color: f.color }}>{f.tagline}</span>
              </div>
            </div>

            {/* Content */}
            <div className="fp-card-body">
              <h3 className="fp-card-title">{f.title}</h3>
              <p className="fp-card-desc">{f.desc}</p>
            </div>

            {/* Footer */}
            <div className="fp-card-footer">
              <span className="fp-card-stat" style={{ color: f.color }}>⚡ {f.stat}</span>
              <div className="fp-launch-btn" style={{ borderColor: f.color + "60", color: f.color }}>
                Launch
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* Bottom accent line */}
            <div className="fp-card-line" style={{ background: `linear-gradient(90deg, transparent, ${f.color}, transparent)` }} />
          </button>
        ))}
      </div>

      {/* Stats bar at bottom */}
      <div className="fp-stats-bar">
        {[
          { n: "466M+", l: "People Impacted" },
          { n: "< 1.2s", l: "AI Response Time" },
          { n: "6", l: "AI Modules" },
          { n: "100%", l: "Privacy-First" },
        ].map((s, i) => (
          <div key={i} className="fp-stat">
            <span className="fp-stat-n">{s.n}</span>
            <span className="fp-stat-l">{s.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
