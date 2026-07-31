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

  useEffect(() => {
    const unsub = subscribeSpeakingState((speaking) => {
      setIsSpeaking(speaking);
    });
    return unsub;
  }, []);

  // Loop A — speech in, captions out
  useEffect(() => {
    if (!sttOn || !isSTTSupported()) return;
    const stop = listen(async (transcript, isFinal) => {
      if (!isFinal || !transcript.trim()) return;
      const { label, emoji } = await tagEmotion(transcript);
      setCaptions((c) => [...c.slice(-6), { text: transcript, label, emoji }]);
      announce(`${transcript}. Tone: ${label}`);
    });
    return stop;
  }, [sttOn]);

  // Loop B — gesture in, speech out
  useEffect(() => {
    if (!ready) return;
    let stopped = false;
    getHandLandmarker().then((landmarker) => {
      const loop = () => {
        if (stopped) return;
        const video = videoRef.current;
        if (video && video.readyState >= 2) {
          const result = landmarker.detectForVideo(video, performance.now());
          const points = result?.landmarks?.[0];
          if (points) {
            const match = classifyLandmarks(points);
            if (match && match.word !== lastWordRef.current) {
              lastWordRef.current = match.word;
              setWords((w) => [...w, match.word]);
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
    <section aria-label="Two-way conversation">
      <div className="conversation-grid">
        <div>
          <h2>Hearing person speaks</h2>
          <button className="primary-btn" onClick={() => setSttOn((v) => !v)}>
            {sttOn ? "Stop listening" : "Start listening"}
          </button>
          <ul aria-label="Live captions" className="caption-list">
            {captions.map((c, i) => (
              <li key={i}>
                <span aria-hidden="true">{c.emoji}</span> {c.text}
                <span className="tone-tag"> ({c.label})</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2>Non-hearing person signs</h2>
          <div className="camera-frame">
            <video ref={videoRef} muted playsInline aria-hidden="true" />
          </div>
          <p>Buffered: {words.join(" · ") || "(none yet)"}</p>

          <div className="action-button-row">
            <button className="primary-btn" onClick={speakBufferedWords} disabled={!words.length}>
              Speak sentence aloud 🔊
            </button>
            {isSpeaking && (
              <span className="speaking-badge" role="status" aria-live="polite">
                🔊 Speaking...
              </span>
            )}
          </div>

          {lastSpoken && <TTSControls textToSpeak={lastSpoken} />}
        </div>
      </div>
    </section>
  );
}
