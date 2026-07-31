import { useEffect, useRef, useState } from "react";
import { useCamera } from "../lib/useCamera";
import { getHandLandmarker } from "../lib/mediapipeHands";
import { preprocessLandmarks } from "../lib/landmarks";
import { addSample, listCustomGestures, deleteGesture } from "../lib/gestureStore";
import { announce } from "../lib/announce";

const SAMPLES_PER_SIGN = 5;

export function SignTrainer() {
  const { videoRef, ready, error } = useCamera();
  const [word, setWord] = useState("");
  const [captured, setCaptured] = useState(0);
  const [gestures, setGestures] = useState(listCustomGestures());
  const latestPointsRef = useRef<any>(null);

  // Keep a live feed of the current landmark reading so "Capture sample"
  // grabs whatever pose is on screen at the moment the button is pressed.
  useEffect(() => {
    if (!ready) return;
    let stopped = false;
    getHandLandmarker().then((landmarker) => {
      const loop = () => {
        if (stopped) return;
        const video = videoRef.current;
        if (video && video.readyState >= 2) {
          const result = landmarker.detectForVideo(video, performance.now());
          latestPointsRef.current = result?.landmarks?.[0] ?? null;
        }
        requestAnimationFrame(loop);
      };
      loop();
    });
    return () => {
      stopped = true;
    };
  }, [ready]);

  function captureSample() {
    const points = latestPointsRef.current;
    if (!word.trim()) {
      announce("Type the word for this sign first.");
      return;
    }
    if (!points) {
      announce("No hand detected. Hold your sign steady in front of the camera.");
      return;
    }
    const vector = preprocessLandmarks(points);
    addSample(word.trim().toLowerCase(), vector);
    const next = captured + 1;
    setCaptured(next);
    announce(`Sample ${next} of ${SAMPLES_PER_SIGN} captured for ${word}.`);
    if (next >= SAMPLES_PER_SIGN) {
      setGestures(listCustomGestures());
      announce(`${word} is now trained and ready to use.`);
    }
  }

  function resetWord() {
    setWord("");
    setCaptured(0);
  }

  return (
    <section aria-label="Teach a new sign">
      <p>
        Type a word, hold your sign steadily, and capture {SAMPLES_PER_SIGN} samples. No
        retraining step needed — it's ready to recognize immediately.
      </p>

      <div className="camera-frame">
        <video ref={videoRef} muted playsInline aria-hidden="true" />
        {error && <p role="alert">Camera error: {error}</p>}
      </div>

      <label htmlFor="sign-word">Word for this sign</label>
      <input
        id="sign-word"
        value={word}
        onChange={(e) => {
          setWord(e.target.value);
          setCaptured(0);
        }}
        placeholder="e.g. water"
      />

      <button className="primary-btn" onClick={captureSample} disabled={!ready}>
        Capture sample ({captured}/{SAMPLES_PER_SIGN})
      </button>
      <button onClick={resetWord}>Start a different word</button>

      <h2>Your trained signs</h2>
      <ul>
        {gestures.map((g) => (
          <li key={g.word}>
            {g.word} ({g.samples.length} samples){" "}
            <button
              onClick={() => {
                deleteGesture(g.word);
                setGestures(listCustomGestures());
              }}
            >
              Delete
            </button>
          </li>
        ))}
        {gestures.length === 0 && <li>No custom signs yet.</li>}
      </ul>
    </section>
  );
}
