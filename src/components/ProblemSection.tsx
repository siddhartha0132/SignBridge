import { type Mode } from "./ModeNav";

interface ProblemSectionProps {
  onStartDemo: (mode: Mode) => void;
}

export function ProblemSection({ onStartDemo }: ProblemSectionProps) {
  return (
    <div className="landing-wrapper">
      {/* Hero Banner */}
      <section className="hero-section">
        <div className="hero-glow-bg"></div>
        <div className="hero-pill-badge">
          <span className="badge-sparkle">✦</span>
          <span>HACKATHON WINNING INNOVATION · AI FOR ALL ACCESSIBILITY</span>
        </div>

        <h1 className="hero-title">
          Bridging Silence with <br />
          <span className="gradient-text-flowing">Sight, Speech &amp; Sound</span>
        </h1>

        <p className="hero-subtitle">
          SignBridge is a real-time, multi-modal AI companion that transforms sign language gestures 
          into fluent spoken sentences, tags emotional tone in conversation, describes surroundings 
          for sight assistance, and provides instant emergency protection.
        </p>

        <div className="hero-cta-group">
          <button className="cta-primary-btn" onClick={() => onStartDemo("sign-to-sentence")}>
            <span>🚀 Try Sign → Sentence Translator</span>
          </button>
          <button className="cta-secondary-btn" onClick={() => onStartDemo("conversation")}>
            <span>💬 Two-Way Conversation</span>
          </button>
        </div>

        {/* Live Metrics Row */}
        <div className="hero-stats-row">
          <div className="stat-card">
            <span className="stat-number">466M+</span>
            <span className="stat-label">People with Hearing Loss Worldwide</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">&lt; 1.2s</span>
            <span className="stat-label">Real-time Gesture-to-Speech Latency</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">100%</span>
            <span className="stat-label">Privacy-First Edge Gesture Pipeline</span>
          </div>
        </div>
      </section>

      {/* Problem Statement Section */}
      <section id="problem" className="problem-section">
        <div className="section-header text-center">
          <span className="section-tag tagline-danger">THE PROBLEM STATEMENT</span>
          <h2 className="section-title">The Hidden Barrier in Everyday Communication</h2>
          <p className="section-desc">
            Over 466 million people globally are deaf or hard-of-hearing. Traditional communication 
            methods create friction, delay, and safety risks.
          </p>
        </div>

        <div className="problem-grid">
          {/* Card 1: Communication Isolation */}
          <div className="problem-card card-glow-pink">
            <div className="card-header">
              <span className="card-icon">🚫</span>
              <span className="card-badge badge-rose">Communication Gap</span>
            </div>
            <h3>Fragmented Communication</h3>
            <p>
              Signers cannot easily communicate with non-signers without expensive interpreters. 
              Text apps are slow, awkward in groups, and destroy natural flow.
            </p>
            <div className="card-footer-metric">
              <span>Impact: Social Isolation &amp; Workplace Barriers</span>
            </div>
          </div>

          {/* Card 2: Missing Emotion & Context */}
          <div className="problem-card card-glow-amber">
            <div className="card-header">
              <span className="card-icon">🎭</span>
              <span className="card-badge badge-amber">Context &amp; Emotion</span>
            </div>
            <h3>Emotionless Translation</h3>
            <p>
              Raw word-by-word sign translation loses grammatical context and emotional tone. 
              Deaf individuals miss whether a speaker is happy, urgent, or concerned.
            </p>
            <div className="card-footer-metric">
              <span>Impact: Misunderstandings &amp; Lost Tone</span>
            </div>
          </div>

          {/* Card 3: Emergency & Sight Isolation */}
          <div className="problem-card card-glow-purple">
            <div className="card-header">
              <span className="card-icon">⚠️</span>
              <span className="card-badge badge-purple">Safety &amp; Sight</span>
            </div>
            <h3>Critical Safety Blindspots</h3>
            <p>
              In dangerous or emergency scenarios, deaf or visually impaired individuals cannot 
              easily place emergency calls or navigate hazardous surroundings independently.
            </p>
            <div className="card-footer-metric">
              <span>Impact: Lifesaving Safety Vulnerabilities</span>
            </div>
          </div>
        </div>
      </section>

      {/* Solution & Feature Showcase Section */}
      <section id="features" className="solution-section">
        <div className="section-header text-center">
          <span className="section-tag tagline-accent">THE SIGNBRIDGE INNOVATION</span>
          <h2 className="section-title">A Complete 360° Accessibility Ecosystem</h2>
          <p className="section-desc">
            SignBridge combines computer vision, LLM sentence reconstruction, Web Speech TTS, 
            sentiment tagging, and tactile Braille into a single unified platform.
          </p>
        </div>

        <div className="solution-grid">
          {/* Feature 1 */}
          <div className="feature-box" onClick={() => onStartDemo("sign-to-sentence")}>
            <div className="feature-icon-wrapper icon-cyan">🖐️</div>
            <div className="feature-content">
              <h3>Sign → Grammatical Sentence &amp; Speech</h3>
              <p>
                Translates raw hand gestures in real-time into fluid, grammatically complete 
                spoken sentences spoken aloud via high-quality TTS.
              </p>
              <button className="feature-link-btn">Try Feature →</button>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="feature-box" onClick={() => onStartDemo("conversation")}>
            <div className="feature-icon-wrapper icon-emerald">🗣️</div>
            <div className="feature-content">
              <h3>Two-Way Emotion-Aware Conversation</h3>
              <p>
                Live microphone speech-to-text with real-time sentiment analysis tagging emotional 
                tone (Happy, Urgent, Calm) alongside live captions.
              </p>
              <button className="feature-link-btn">Try Feature →</button>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="feature-box" onClick={() => onStartDemo("describe")}>
            <div className="feature-icon-wrapper icon-amber">👁️</div>
            <div className="feature-content">
              <h3>Surroundings Sight Companion</h3>
              <p>
                AI vision analysis captures webcam snapshots and provides spoken descriptions of 
                obstacles, people, and safety hazards for visually impaired users.
              </p>
              <button className="feature-link-btn">Try Feature →</button>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="feature-box" onClick={() => onStartDemo("trainer")}>
            <div className="feature-icon-wrapper icon-pink">🎓</div>
            <div className="feature-content">
              <h3>Interactive Custom Sign Trainer</h3>
              <p>
                Empowers users to teach the system custom sign language gestures right in the 
                browser without re-training complex models.
              </p>
              <button className="feature-link-btn">Try Feature →</button>
            </div>
          </div>

          {/* Feature 5 */}
          <div className="feature-box" onClick={() => onStartDemo("braille")}>
            <div className="feature-icon-wrapper icon-purple">⠃⠗⠇</div>
            <div className="feature-content">
              <h3>Text → Grade-1 Braille Translator</h3>
              <p>
                Instant bidirectional translation between text and Unicode Braille characters 
                with tactile reference guides.
              </p>
              <button className="feature-link-btn">Try Feature →</button>
            </div>
          </div>

          {/* Feature 6 */}
          <div className="feature-box" onClick={() => onStartDemo("settings")}>
            <div className="feature-icon-wrapper icon-red">🚨</div>
            <div className="feature-content">
              <h3>Isolated Emergency SOS Sentinel</h3>
              <p>
                Detects a 3-second held fist gesture independently of active translation and triggers 
                an instant emergency alert to trusted contacts.
              </p>
              <button className="feature-link-btn">Configure SOS →</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
