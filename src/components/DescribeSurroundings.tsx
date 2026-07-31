import { useState } from "react";
import { useCamera } from "../lib/useCamera";
import { captureFrame, describeImage } from "../lib/vision";
import { speak, primeSpeech } from "../lib/speech";
import { announce } from "../lib/announce";
import { TTSControls } from "./TTSControls";

export function DescribeSurroundings() {
  const { videoRef, ready, error } = useCamera();
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCapture() {
    if (!videoRef.current) return;
    primeSpeech(); // Prime speech synchronously on click
    setLoading(true);
    announce("Taking photo and describing your surroundings.");
    try {
      const frame = captureFrame(videoRef.current);
      const text = await describeImage(frame);
      setDescription(text);
      speak(text);
      announce(text);
    } catch (e) {
      announce("Sorry, I couldn't describe the photo. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section aria-label="Describe my surroundings" className="feature-container">
      <div className="feature-panel" style={{ borderTop: "4px solid var(--accent-amber)" }}>
        <h2 className="tool-label" style={{ fontSize: "1.1rem" }}>Vision AI</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
          Position your camera and take a photo. The AI will analyze the scene and speak aloud a detailed description of your surroundings.
        </p>

        <div className="camera-frame">
          <video ref={videoRef} muted playsInline aria-hidden="true" />
          {error && <p role="alert">Camera error: {error}</p>}
        </div>
        
        <div className="feature-actions" style={{ marginTop: "1.5rem" }}>
          <button 
            className="primary-btn" 
            style={{ width: "100%", background: loading ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #f59e0b, #d97706)", color: loading ? "var(--text-muted)" : "#fff" }} 
            onClick={handleCapture} 
            disabled={!ready || loading}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                <span className="pulse-record" style={{ background: "#f59e0b", boxShadow: "none", animation: "pulse-amber 1.5s infinite" }}></span> Analyzing Scene...
              </span>
            ) : "Take Photo & Describe 🔊"}
          </button>
        </div>
      </div>

      {description && (
        <div className="feature-panel" style={{ animation: "fadeSlideUp 0.3s ease-out" }}>
          <h2 className="tool-label" style={{ fontSize: "1.1rem", color: "var(--accent-amber)" }}>Scene Description</h2>
          <div className="sentence-output-card" style={{ marginTop: "1rem", boxShadow: "none", background: "rgba(0,0,0,0.2)" }}>
            <p className="sentence-output" aria-label="Scene description">
              {description}
            </p>
            <TTSControls textToSpeak={description} />
          </div>
        </div>
      )}
    </section>
  );
}
