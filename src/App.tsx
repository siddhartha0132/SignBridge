import { useState, useEffect } from "react";
import { ModeNav, type Mode } from "./components/ModeNav";
import { LandingHeader } from "./components/LandingHeader";
import { HomePage3D } from "./components/HomePage3D";
import { FeaturesPage } from "./components/FeaturesPage";
import { SignToSentence } from "./components/SignToSentence";
import { Conversation } from "./components/Conversation";
import { DescribeSurroundings } from "./components/DescribeSurroundings";
import { SignTrainer } from "./components/SignTrainer";
import { BrailleView } from "./components/BrailleView";
import { EmergencyContactSetup } from "./components/EmergencyButton";

export default function App() {
  const [mode, setMode] = useState<Mode>("home");

  // Handle scrolling to top when mode changes, or scrolling to workspace
  const handleStartMode = (newMode: Mode) => {
    setMode(newMode);
    
    // If going to features or home, scroll to top
    if (newMode === "home" || newMode === "features") {
       window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
       // If launching a specific tool, scroll to workspace
       setTimeout(() => {
         document.getElementById("live-app-workspace")?.scrollIntoView({ behavior: "smooth" });
       }, 50);
    }
  };

  return (
    <div className="app-root dark-theme">
      {/* Top Winning Navigation Header */}
      <LandingHeader currentMode={mode} onSelectMode={handleStartMode} />

      {/* Main Container */}
      <div className="app-container">
        {/* Sticky Floating Mode Navigation Bar (only show on active tools, not home/features) */}
        {mode !== "home" && mode !== "features" && (
            <ModeNav mode={mode} onChange={setMode} />
        )}

        {/* Home / 3D Landing Page Hero */}
        {mode === "home" && <HomePage3D onStartDemo={handleStartMode} />}

        {/* Features Selection Page */}
        {mode === "features" && (
            <FeaturesPage 
                onSelectFeature={handleStartMode} 
                onBack={() => handleStartMode("home")} 
            />
        )}

        {/* Live Workspace Container */}
        {mode !== "home" && mode !== "features" && (
          <main id="live-app-workspace" className="app-workspace-card" aria-label={`${mode} panel`}>
            <div className="workspace-header">
              <span className="workspace-badge">LIVE INTERACTIVE PLAYGROUND</span>
              <h2>
                {mode === "sign-to-sentence" && "Sign → Sentence Translator"}
                {mode === "conversation" && "Two-Way Emotion-Aware Conversation"}
                {mode === "describe" && "Surroundings Sight Companion"}
                {mode === "trainer" && "Teach a New Sign"}
                {mode === "braille" && "Text → Braille Translator"}
                {mode === "settings" && "Emergency Sentinel Setup"}
              </h2>
            </div>

            <div className="workspace-content">
              {mode === "sign-to-sentence" && <SignToSentence />}
              {mode === "conversation" && <Conversation />}
              {mode === "describe" && <DescribeSurroundings />}
              {mode === "trainer" && <SignTrainer />}
              {mode === "braille" && <BrailleView />}
              {mode === "settings" && <EmergencyContactSetup />}
            </div>
          </main>
        )}

        {/* Hackathon Footer */}
        <footer className="site-footer">
          <div className="footer-content">
            <div className="footer-brand">
              <span className="footer-logo">🤟 SignBridge</span>
              <p>Real-time AI companion for sign language, speech synthesis, and sight assistance.</p>
            </div>
            <div className="footer-meta">
              <span className="badge-hackathon">🏆 HACKATHON 2026 WINNING ENTRY</span>
              <p>Built with MediaPipe · Web Speech API · LLM Grammar Engine · React 18</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
