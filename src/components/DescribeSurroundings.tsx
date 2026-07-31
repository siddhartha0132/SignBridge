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
    <section aria-label="Describe my surroundings">
      <div className="camera-frame">
        <video ref={videoRef} muted playsInline aria-hidden="true" />
        {error && <p role="alert">Camera error: {error}</p>}
      </div>

      <button className="primary-btn" onClick={handleCapture} disabled={!ready || loading}>
        {loading ? "Describing…" : "Take photo & describe 🔊"}
      </button>

      {description && (
        <div className="sentence-output-card">
          <p className="sentence-output" aria-label="Scene description">
            {description}
          </p>
          <TTSControls textToSpeak={description} />
        </div>
      )}
    </section>
  );
}
