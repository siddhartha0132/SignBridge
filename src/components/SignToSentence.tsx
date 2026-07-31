import { useEffect, useRef, useState } from "react";
import { useCamera } from "../lib/useCamera";
import { getHandLandmarker } from "../lib/mediapipeHands";
import { classifyLandmarks } from "../lib/classifier";
import { reconstructSentence } from "../lib/llm";
import { speak } from "../lib/speech";
import { announce } from "../lib/announce";
import { DistressWatcher, sendDistressAlert } from "../lib/emergency";

const WORD_GAP_MS = 1200; // no new word for this long -> treat buffer as one utterance

export function SignToSentence() {
  const { videoRef, ready, error } = useCamera();
  const [words, setWords] = useState<string[]>([]);
  const [sentence, setSentence] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [distressArmed, setDistressArmed] = useState(false);

  const lastWordRef = useRef<string | null>(null);
  const lastWordTimeRef = useRef(0);
  const watcherRef = useRef(new DistressWatcher());
  const rafRef = useRef<number>();

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
    if (words.length === 0) return;
    const result = await reconstructSentence(words, history);
    setSentence(result);
    setHistory((h) => [...h.slice(-4), result]);
    setWords([]);
    speak(result);
    announce(`Sentence: ${result}`);
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

      <button className="primary-btn" onClick={buildSentence} disabled={words.length === 0}>
        Build sentence &amp; speak
      </button>

      {sentence && (
        <p className="sentence-output" aria-label="Reconstructed sentence">
          {sentence}
        </p>
      )}

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
