import { useEffect, useRef, useState } from "react";
import { useCamera } from "../lib/useCamera";
import { getHandLandmarker } from "../lib/mediapipeHands";
import { classifyLandmarks } from "../lib/classifier";
import { reconstructSentence } from "../lib/llm";
import { speak, primeSpeech, subscribeSpeakingState } from "../lib/speech";
import { announce } from "../lib/announce";
import { DistressWatcher, sendDistressAlert } from "../lib/emergency";
import { TTSControls } from "./TTSControls";

const WORD_GAP_MS = 1200; // no new word for this long -> treat buffer as one utterance

export function SignToSentence() {
  const { videoRef, ready, error } = useCamera();
  const [words, setWords] = useState<string[]>([]);
  const [sentence, setSentence] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [distressArmed, setDistressArmed] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);

  const lastWordRef = useRef<string | null>(null);
  const lastWordTimeRef = useRef(0);
  const watcherRef = useRef(new DistressWatcher());
  const rafRef = useRef<number>();

  useEffect(() => {
    const unsub = subscribeSpeakingState((speaking) => {
      setIsSpeaking(speaking);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!ready) return;
    let stopped = false;

    getHandLandmarker().then((landmarker) => {
      const loop = () => {
        if (stopped) return;
        const video = videoRef.current;
        if (video && video.readyState >= 2) {
          const now = performance.now();
          const result = landmarker.detectForVideo(video, now);
          const points = result?.landmarks?.[0];

          if (points) {
            // Distress check runs independently of word recognition — see
            // workflow.md "Isolation of the emergency layer".
            if (watcherRef.current.update(points, now)) {
              setDistressArmed(true);
              announce("Distress gesture detected. Confirm or cancel the alert.");
            }

            const match = classifyLandmarks(points);
            if (match && match.word !== lastWordRef.current) {
              lastWordRef.current = match.word;
              lastWordTimeRef.current = now;
              setWords((w) => [...w, match.word]);
              announce(`Recognized sign: ${match.word}`);
            } else if (now - lastWordTimeRef.current > WORD_GAP_MS) {
              lastWordRef.current = null; // allow repeating the same sign again
            }
          }
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      loop();
    });

    return () => {
      stopped = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [ready]);

  async function buildSentence() {
    if (words.length === 0 || isBuilding) return;

    // CRITICAL FIX: Prime Web Speech API audio context synchronously on user click gesture!
    // This unlocks browser autoplay policies before the async LLM network call.
    primeSpeech();

    setIsBuilding(true);
    try {
      const currentWords = [...words];
      const result = await reconstructSentence(currentWords, history);
      setSentence(result);
      setHistory((h) => [...h.slice(-4), result]);
      setWords([]);

      // Speak the reconstructed sentence aloud
      speak(result);
      announce(`Sentence generated and spoken: ${result}`);
    } catch (err) {
      console.error("Sentence building error:", err);
      announce("Failed to reconstruct sentence. Please try again.");
    } finally {
      setIsBuilding(false);
    }
  }

  return (
    <section aria-label="Sign to sentence translator">
      <div className="camera-frame">
        <video ref={videoRef} muted playsInline aria-hidden="true" />
        {error && <p role="alert">Camera error: {error}</p>}
      </div>

      <p aria-live="off">
        <strong>Buffered words:</strong> {words.join(" · ") || "(none yet)"}
      </p>

      <div className="action-button-row">
        <button
          className="primary-btn build-speak-btn"
          onClick={buildSentence}
          disabled={words.length === 0 || isBuilding}
        >
          {isBuilding ? "Building sentence..." : "Build sentence & speak 🔊"}
        </button>

        {isSpeaking && (
          <span className="speaking-badge" role="status" aria-live="polite">
            <span className="audio-wave-anim" aria-hidden="true">🔊</span>
            Speaking sentence aloud...
          </span>
        )}
      </div>

      {sentence && (
        <div className="sentence-output-card">
          <p className="sentence-output" aria-label="Reconstructed sentence">
            {sentence}
          </p>
          <TTSControls textToSpeak={sentence} />
        </div>
      )}

      {!sentence && <TTSControls autoShowControls={false} />}

      {distressArmed && (
        <div role="alertdialog" aria-label="Confirm emergency alert" className="distress-banner">
          <p>Fist held for 3 seconds. Send an emergency alert to your trusted contact?</p>
          <button
            className="danger-btn"
            onClick={async () => {
              await sendDistressAlert({ name: "Trusted Contact", phone: "" });
              announce("Emergency alert sent.");
              setDistressArmed(false);
            }}
          >
            Send alert
          </button>
          <button onClick={() => setDistressArmed(false)}>Cancel</button>
        </div>
      )}
    </section>
  );
}
