import { useState, useEffect, useRef } from "react";
import { type Mode } from "./ModeNav";

interface HomePageProps {
  onStartDemo: (mode: Mode) => void;
}

const FEATURES = [
  {
    id: "sign-to-sentence" as Mode,
    icon: "🖐️",
    title: "Sign → Speech",
    desc: "Real-time gesture recognition into grammatically fluent spoken sentences via TTS.",
    badge: "AI-POWERED",
    color: "#06b6d4",
    glow: "rgba(6,182,212,0.4)",
    stat: "< 1.2s Latency",
  },
  {
    id: "conversation" as Mode,
    icon: "🗣️",
    title: "Live Conversation",
    desc: "Two-way emotion-aware dialogue with real-time sentiment tagging and captions.",
    badge: "REAL-TIME",
    color: "#10b981",
    glow: "rgba(16,185,129,0.4)",
    stat: "Emotion Aware",
  },
  {
    id: "describe" as Mode,
    icon: "👁️",
    title: "Sight Companion",
    desc: "AI vision describes surroundings, obstacles, and hazards for visually impaired users.",
    badge: "VISION AI",
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.4)",
    stat: "Scene Analysis",
  },
  {
    id: "trainer" as Mode,
    icon: "🎓",
    title: "Sign Trainer",
    desc: "Teach the AI custom gestures directly in the browser—zero model retraining.",
    badge: "CUSTOM",
    color: "#ec4899",
    glow: "rgba(236,72,153,0.4)",
    stat: "Browser Native",
  },
  {
    id: "braille" as Mode,
    icon: "⠃",
    title: "Braille Bridge",
    desc: "Bidirectional Grade-1 Braille translation with Unicode tactile character guides.",
    badge: "TACTILE",
    color: "#a855f7",
    glow: "rgba(168,85,247,0.4)",
    stat: "Grade-1 Braille",
  },
  {
    id: "settings" as Mode,
    icon: "🚨",
    title: "SOS Sentinel",
    desc: "Fist-held 3 seconds triggers emergency alert to trusted contacts. Silent & instant.",
    badge: "LIFESAVING",
    color: "#f43f5e",
    glow: "rgba(244,63,94,0.4)",
    stat: "3-Second Trigger",
  },
];

export function HomePage3D({ onStartDemo }: HomePageProps) {
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [activeCard, setActiveCard] = useState<number | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    type Particle = { x: number; y: number; vx: number; vy: number; r: number; alpha: number; color: string };
    const particles: Particle[] = [];
    const colors = ["#06b6d4", "#a855f7", "#10b981", "#f43f5e"];

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.5 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.round(p.alpha * 255).toString(16).padStart(2, "0");
        ctx.fill();
      });

      particles.forEach((a, i) => {
        particles.slice(i + 1).forEach((b) => {
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = "rgba(6,182,212," + (0.06 * (1 - dist / 120)) + ")";
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
      animId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      setMouseX((e.clientX / window.innerWidth - 0.5) * 2);
      setMouseY((e.clientY / window.innerHeight - 0.5) * 2);
    };
    window.addEventListener("mousemove", handle);
    return () => window.removeEventListener("mousemove", handle);
  }, []);

  useEffect(() => {
    const handle = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handle, { passive: true });
    return () => window.removeEventListener("scroll", handle);
  }, []);

  return (
    <div className="hp3d-root">
      <canvas ref={canvasRef} className="hp3d-canvas" />

      <div className="hp3d-orb hp3d-orb-1" style={{ transform: "translate(" + (mouseX * -18) + "px, " + (mouseY * -18) + "px)" }} />
      <div className="hp3d-orb hp3d-orb-2" style={{ transform: "translate(" + (mouseX * 14) + "px, " + (mouseY * 14) + "px)" }} />
      <div className="hp3d-orb hp3d-orb-3" style={{ transform: "translate(" + (mouseX * -10) + "px, " + (mouseY * 10) + "px)" }} />

      <section className="hp3d-hero" ref={heroRef}>
        <div className="hp3d-hero-inner" style={{ transform: "translateY(" + (scrollY * 0.25) + "px)" }}>
          <div className="hp3d-pill">
            <span className="hp3d-pill-dot" />
            <span>HACKATHON 2026 WINNING INNOVATION</span>
            <span className="hp3d-pill-badge">AI ACCESSIBILITY</span>
          </div>

          <div
            className="hp3d-title-3d"
            style={{ transform: "perspective(1000px) rotateX(" + (mouseY * -3) + "deg) rotateY(" + (mouseX * 3) + "deg)" }}
          >
            <h1 className="hp3d-h1">
              <span className="hp3d-h1-line1">Bridging</span>
              <span className="hp3d-h1-gradient">Silence</span>
              <span className="hp3d-h1-line3">with AI</span>
            </h1>
          </div>

          <p className="hp3d-subtitle">
            SignBridge is a real-time, multi-modal AI companion that transforms sign language
            gestures into fluent speech, tags emotional tone, describes surroundings for sight
            assistance, and provides instant emergency protection—all in one unified platform.
          </p>

          <div className="hp3d-cta-row">
            <button className="hp3d-btn-primary hp3d-btn-large" onClick={() => onStartDemo("sign-to-sentence")}>
              <span>🚀 Launch App</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="hp3d-pipeline">
            {["Gesture Capture", "→", "AI Recognition", "→", "TTS Speech", "→", "Emotion Tag"].map((s, i) => (
              <div key={i} className={s === "→" ? "hp3d-pipeline-arrow" : "hp3d-pipeline-step"} style={{ animationDelay: (i * 0.15) + "s" }}>
                {s !== "→" ? (
                  <>
                    <span className="hp3d-pipeline-dot" />
                    <span>{s}</span>
                  </>
                ) : s}
              </div>
            ))}
          </div>
        </div>

        <div className="hp3d-stats-row" style={{ transform: "translateY(" + (scrollY * 0.1) + "px)" }}>
          {[
            { n: "466M+", l: "People with Hearing Loss" },
            { n: "< 1.2s", l: "Gesture-to-Speech Latency" },
            { n: "100%", l: "Privacy-First Edge Pipeline" },
            { n: "6 AI", l: "Multimodal Modules" },
          ].map((s, i) => (
            <div key={i} className="hp3d-stat-card" style={{ animationDelay: (i * 0.12) + "s" }}>
              <span className="hp3d-stat-n">{s.n}</span>
              <span className="hp3d-stat-l">{s.l}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="hp3d-problem-section">
        <div className="hp3d-section-label">THE PROBLEM</div>
        <h2 className="hp3d-section-h2">The Hidden Barrier in<br /><span className="hp3d-h2-accent">Everyday Communication</span></h2>
        <p className="hp3d-section-p">
          Over 466 million people globally are deaf or hard-of-hearing. Traditional communication methods
          create friction, delay, and life-threatening safety risks every day.
        </p>

        <div className="hp3d-problem-grid">
          {[
            { icon: "🚫", title: "Fragmented Communication", color: "#f43f5e", desc: "Signers cannot easily communicate with non-signers without expensive interpreters. Text apps are slow, awkward in groups, and destroy natural conversational flow.", badge: "Communication Gap" },
            { icon: "🎭", title: "Emotionless Translation", color: "#f59e0b", desc: "Raw word-by-word sign translation loses grammatical context and emotional tone. Deaf individuals miss whether a speaker is happy, urgent, or concerned.", badge: "Context & Emotion" },
            { icon: "⚠️", title: "Critical Safety Blindspots", color: "#a855f7", desc: "In dangerous or emergency scenarios, deaf or visually impaired individuals cannot easily place emergency calls or navigate hazardous surroundings independently.", badge: "Safety & Sight" },
          ].map((p, i) => (
            <div key={i} className="hp3d-problem-card" style={{ "--card-color": p.color, animationDelay: (i * 0.2) + "s" } as React.CSSProperties}>
              <div className="hp3d-problem-icon">{p.icon}</div>
              <span className="hp3d-problem-badge" style={{ color: p.color, borderColor: p.color + "40", background: p.color + "15" }}>{p.badge}</span>
              <h3>{p.title}</h3>
              <p>{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="hp3d-features-section">
        <div className="hp3d-section-label">THE INNOVATION</div>
        <h2 className="hp3d-section-h2">A Complete <span className="hp3d-h2-accent">360° Accessibility</span><br />Ecosystem</h2>
        <p className="hp3d-section-p">
          SignBridge combines computer vision, LLM sentence reconstruction, Web Speech TTS,
          sentiment tagging, and tactile Braille into a single unified platform.
        </p>

        <div className="hp3d-features-grid">
          {FEATURES.map((f, i) => (
            <div
              key={f.id}
              className={"hp3d-feature-card" + (activeCard === i ? " hp3d-feature-card-active" : "")}
              style={{
                "--card-color": f.color,
                "--card-glow": f.glow,
                animationDelay: (i * 0.08) + "s",
                transform: activeCard === i
                  ? "perspective(800px) rotateX(" + (mouseY * -6) + "deg) rotateY(" + (mouseX * 6) + "deg) translateZ(20px) scale(1.03)"
                  : "perspective(800px) rotateX(" + (mouseY * -2) + "deg) rotateY(" + (mouseX * 2) + "deg) translateZ(0px) scale(1)",
              } as React.CSSProperties}
              onMouseEnter={() => setActiveCard(i)}
              onMouseLeave={() => setActiveCard(null)}
              onClick={() => onStartDemo(f.id)}
            >
              <div className="hp3d-card-glow" />
              <div className="hp3d-card-topbar">
                <span className="hp3d-card-badge-top" style={{ color: f.color, background: f.color + "18", borderColor: f.color + "35" }}>{f.badge}</span>
                <div className="hp3d-card-dot" style={{ background: f.color, boxShadow: "0 0 8px " + f.color }} />
              </div>
              <div className="hp3d-card-icon-wrap" style={{ boxShadow: "0 8px 32px " + f.glow, background: f.color + "18" }}>
                <span className="hp3d-card-icon">{f.icon}</span>
              </div>
              <div className="hp3d-card-content">
                <h3 className="hp3d-card-title">{f.title}</h3>
                <p className="hp3d-card-desc">{f.desc}</p>
              </div>
              <div className="hp3d-card-footer">
                <span className="hp3d-card-stat" style={{ color: f.color }}>{f.stat}</span>
                <button className="hp3d-card-cta" style={{ color: f.color, borderColor: f.color + "50" }}>Try Now →</button>
              </div>
              <div className="hp3d-card-line" style={{ background: "linear-gradient(to right, transparent, " + f.color + ", transparent)" }} />
            </div>
          ))}
        </div>
      </section>

      <section className="hp3d-tech-section">
        <div className="hp3d-section-label">UNDER THE HOOD</div>
        <h2 className="hp3d-section-h2">Built with <span className="hp3d-h2-accent">World-Class</span> Technology</h2>
        <div className="hp3d-tech-grid">
          {[
            { name: "MediaPipe", role: "Hand Landmark Detection", color: "#06b6d4" },
            { name: "Web Speech API", role: "Real-Time TTS & STT", color: "#10b981" },
            { name: "LLM Engine", role: "Grammar Reconstruction", color: "#a855f7" },
            { name: "React 18", role: "Concurrent UI Rendering", color: "#f59e0b" },
            { name: "Canvas API", role: "Gesture Visualization", color: "#f43f5e" },
            { name: "Sentiment NLP", role: "Emotion Detection", color: "#ec4899" },
          ].map((t, i) => (
            <div key={i} className="hp3d-tech-card" style={{ animationDelay: (i * 0.1) + "s" }}>
              <div className="hp3d-tech-indicator" style={{ background: t.color }} />
              <span className="hp3d-tech-name" style={{ color: t.color }}>{t.name}</span>
              <span className="hp3d-tech-role">{t.role}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="hp3d-cta-section">
        <div
          className="hp3d-cta-card"
          style={{ transform: "perspective(1200px) rotateX(" + (mouseY * -2) + "deg) rotateY(" + (mouseX * 2) + "deg)" }}
        >
          <div className="hp3d-cta-orb1" />
          <div className="hp3d-cta-orb2" />
          <div className="hp3d-cta-inner">
            <span className="hp3d-cta-tag">🏆 HACKATHON 2026 · ACCESSIBILITY INNOVATION</span>
            <h2 className="hp3d-cta-h2">Ready to Experience<br /><span className="hp3d-h2-accent">SignBridge?</span></h2>
            <p className="hp3d-cta-p">
              Launch the live interactive playground and experience the future of accessibility technology firsthand.
            </p>
            <button className="hp3d-btn-primary hp3d-btn-large" onClick={() => onStartDemo("sign-to-sentence")}>
              <span>🚀 Launch Full Experience</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
