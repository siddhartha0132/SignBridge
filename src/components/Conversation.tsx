import { useEffect, useRef, useState } from "react";
import { useCamera } from "../lib/useCamera";
import { getHandLandmarker } from "../lib/mediapipeHands";
import { classifyLandmarks } from "../lib/classifier";
import { reconstructSentence, tagEmotion } from "../lib/llm";
import { listen, speak, primeSpeech, isSTTSupported, subscribeSpeakingState } from "../lib/speech";
import { announce } from "../lib/announce";
import { TTSControls } from "./TTSControls";

type CaptionEntry = { text: string; emoji: string; label: string };

export function Conversation() {
  const { videoRef, ready } = useCamera();
  const [captions, setCaptions] = useState<CaptionEntry[]>([]);
  const [words, setWords] = useState<string[]>([]);
  const [sttOn, setSttOn] = useState(false);
  const [lastSpoken, setLastSpoken] = useState<string>("");
  const [isSpeaking, setIsSpeaking] = useState(false);

  const lastWordRef = useRef<string | null>(null);
  const rafRef = useRef<number>();
  const sttOnRef = useRef(false);

  useEffect(() => {
    sttOnRef.current = sttOn;
  }, [sttOn]);

  useEffect(() => {
    const unsub = subscribeSpeakingState((speaking) => {
      setIsSpeaking(speaking);
    });
    return unsub;
  }, []);

  // Loop A — speech in, captions out
  useEffect(() => {
    if (!sttOn || !isSTTSupported()) return;
    let stopFn: (() => void) | undefined;
    let isIntentionalStop = false;

    const startListening = () => {
      stopFn = listen(
        async (transcript, isFinal) => {
          if (!isFinal || !transcript.trim()) return;
          const { label, emoji } = await tagEmotion(transcript);
          setCaptions((c) => [...c.slice(-6), { text: transcript, label, emoji }]);
          announce(`${transcript}. Tone: ${label}`);
        },
        () => {
          // If the browser stopped it automatically but we didn't toggle it off, restart it
          if (!isIntentionalStop && sttOnRef.current) {
            setTimeout(startListening, 200);
          }
        }
      );
    };

    startListening();

    return () => {
      isIntentionalStop = true;
      if (stopFn) stopFn();
    };
  }, [sttOn]);

  // Loop B — gesture in, speech out
  useEffect(() => {
    if (!ready) return;
    let stopped = false;
    
    // Debounce state inside the effect
    let consecutiveFrames = 0;
    let pendingWord: string | null = null;
    let lastRegisteredWord: string | null = null;
    
    getHandLandmarker().then((landmarker) => {
      const loop = () => {
        if (stopped) return;
        const video = videoRef.current;
        if (video && video.readyState >= 2) {
          const result = landmarker.detectForVideo(video, performance.now());
          const points = result?.landmarks?.[0];

          if (points) {
            const match = classifyLandmarks(points);
            if (match) {
              if (match.word === pendingWord) {
                consecutiveFrames++;
                // Require 8 consecutive frames of the exact same sign to register it
                if (consecutiveFrames === 8) {
                  if (match.word !== lastRegisteredWord) {
                    lastRegisteredWord = match.word;
                    setWords((w) => [...w, match.word]);
                  }
                }
              } else {
                pendingWord = match.word;
                consecutiveFrames = 1;
              }
            } else {
              // Hand is visible but no sign is recognized (transitioning/resting)
              consecutiveFrames = 0;
              pendingWord = null;
              lastRegisteredWord = null;
            }
          } else {
            // Hand is not visible at all (dropped hand)
            consecutiveFrames = 0;
            pendingWord = null;
            lastRegisteredWord = null;
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

  async function speakBufferedWords() {
    if (words.length === 0) return;
    primeSpeech(); // Prime speech synchronously on user click
    const sentence = await reconstructSentence(words, captions.map((c) => c.text));
    setWords([]);
    setLastSpoken(sentence);
    speak(sentence);
    announce(`Speaking: ${sentence}`);
  }

  return (
    <section aria-label="Two-way conversation" className="feature-container">
      <div className="conversation-grid">
        
        {/* Hearing Person Side */}
        <div className="feature-panel" style={{ borderTop: "4px solid var(--accent-emerald)" }}>
          <h2 className="tool-label" style={{ fontSize: "1.1rem" }}>Hearing Person</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
            Speak into the microphone. AI will tag emotional tone and display live captions for the non-hearing user.
          </p>
          
          <button 
            className="primary-btn" 
            style={{ width: "100%", background: sttOn ? "rgba(244, 63, 94, 0.15)" : "", color: sttOn ? "#f43f5e" : "", border: sttOn ? "1px solid rgba(244,63,94,0.3)" : "" }}
            onClick={() => setSttOn((v) => !v)}
          >
            {sttOn ? (
              <><span className="pulse-record"></span> Stop Listening</>
            ) : (
              "Start Microphone"
            )}
          </button>
          
          <ul aria-label="Live captions" className="caption-list">
            {captions.map((c, i) => (
              <li key={i} className="caption-item">
                <span aria-hidden="true" style={{ fontSize: "1.4rem" }}>{c.emoji}</span>
                <span>{c.text}</span>
                <span className="tone-tag">{c.label}</span>
              </li>
            ))}
            {captions.length === 0 && (
              <div style={{ textAlign: "center", padding: "2rem 0", color: "rgba(255,255,255,0.2)" }}>
                No captions yet.
              </div>
            )}
          </ul>
        </div>

        {/* Non-Hearing Person Side */}
        <div className="feature-panel" style={{ borderTop: "4px solid var(--accent-cyan)" }}>
          <h2 className="tool-label" style={{ fontSize: "1.1rem" }}>Non-Hearing Person</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
            Sign into the camera. AI will reconstruct your gestures into a fluent spoken response contextually aware of the captions.
          </p>

          <div className="camera-frame">
            <video ref={videoRef} muted playsInline aria-hidden="true" />
          </div>
          
          <div style={{ marginTop: "1rem", minHeight: "2rem" }}>
            <p style={{ margin: 0, fontWeight: 600 }}>
              <span style={{ color: "var(--accent-cyan)" }}>Buffered words:</span> {words.length > 0 ? words.join(" · ") : <span style={{color: "rgba(255,255,255,0.3)", fontWeight: 400}}>Waiting for signs...</span>}
            </p>
          </div>

          <div className="feature-actions" style={{ marginTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "1rem" }}>
            <button className="primary-btn" onClick={speakBufferedWords} disabled={!words.length} style={{ width: "100%" }}>
              Speak sentence aloud 🔊
            </button>
            {isSpeaking && (
              <span className="speaking-badge" role="status" aria-live="polite" style={{ width: "100%", justifyContent: "center" }}>
                <span className="audio-wave-anim" aria-hidden="true">🔊</span>
                Speaking...
              </span>
            )}
          </div>

          {lastSpoken && <TTSControls textToSpeak={lastSpoken} />}
        </div>

      </div>
    </section>
  );
}
