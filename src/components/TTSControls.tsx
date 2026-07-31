import { useEffect, useState } from "react";
import {
  speak,
  stopSpeech,
  primeSpeech,
  getAvailableVoices,
  subscribeSpeakingState,
  playFallbackChime,
  setDefaultTTSOptions,
  getDefaultTTSOptions,
  type TTSOptions,
} from "../lib/speech";
import { announce } from "../lib/announce";

interface TTSControlsProps {
  textToSpeak?: string;
  autoShowControls?: boolean;
}

export function TTSControls({ textToSpeak, autoShowControls = false }: TTSControlsProps) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [rate, setRate] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(1.0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(autoShowControls);
  const [speechError, setSpeechError] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to speaking state
    const unsubscribe = subscribeSpeakingState((speaking) => {
      setIsSpeaking(speaking);
    });

    // Populate voices
    const updateVoices = () => {
      const v = getAvailableVoices();
      setVoices(v);
      if (v.length > 0 && !selectedVoice) {
        const defaultV =
          v.find((voice) => voice.lang.startsWith("en") && voice.default) ||
          v.find((voice) => voice.lang.startsWith("en")) ||
          v[0];
        if (defaultV) {
          setSelectedVoice(defaultV.voiceURI);
          setDefaultTTSOptions({ voiceURI: defaultV.voiceURI });
        }
      }
    };

    updateVoices();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    return () => unsubscribe();
  }, []);

  const handleSpeak = (text?: string) => {
    const targetText = text || textToSpeak;
    if (!targetText) return;
    setSpeechError(null);
    primeSpeech();

    const options: TTSOptions = {
      voiceURI: selectedVoice,
      rate,
      pitch,
      volume,
      onError: (err) => {
        setSpeechError("Speech synthesis had an issue. Played audio chime fallback.");
        announce("Speech synthesis error. Audio chime played.");
      },
    };

    speak(targetText, options);
    announce(`Speaking: ${targetText}`);
  };

  const handleTestAudio = () => {
    primeSpeech();
    handleSpeak("Hello! This is a test of SignBridge audio speech.");
  };

  const handleChimeTest = () => {
    playFallbackChime();
    announce("Audio chime played.");
  };

  const handleStop = () => {
    stopSpeech();
    announce("Speech stopped.");
  };

  const handleVoiceChange = (uri: string) => {
    setSelectedVoice(uri);
    setDefaultTTSOptions({ voiceURI: uri });
  };

  const handleRateChange = (r: number) => {
    setRate(r);
    setDefaultTTSOptions({ rate: r });
  };

  const handlePitchChange = (p: number) => {
    setPitch(p);
    setDefaultTTSOptions({ pitch: p });
  };

  const handleVolumeChange = (v: number) => {
    setVolume(v);
    setDefaultTTSOptions({ volume: v });
  };

  return (
    <div className="tts-controls-container">
      <div className="tts-action-row">
        {textToSpeak && (
          <button
            type="button"
            className="tts-speak-btn"
            onClick={() => handleSpeak()}
            disabled={!textToSpeak.trim()}
            aria-label="Listen to sentence aloud"
          >
            {isSpeaking ? (
              <>
                <span className="tts-pulse-icon" aria-hidden="true">
                  🔊
                </span>
                <span>Speaking...</span>
              </>
            ) : (
              <>
                <span aria-hidden="true">🔊</span>
                <span>Listen / Speak again</span>
              </>
            )}
          </button>
        )}

        {isSpeaking && (
          <button
            type="button"
            className="tts-stop-btn"
            onClick={handleStop}
            aria-label="Stop speech"
          >
            🛑 Stop
          </button>
        )}

        <button
          type="button"
          className="tts-settings-toggle"
          onClick={() => setShowSettings(!showSettings)}
          aria-expanded={showSettings}
          aria-label="Audio voice settings"
        >
          ⚙️ {showSettings ? "Hide Voice Options" : "Voice Options"}
        </button>
      </div>

      {speechError && <p className="tts-error-alert" role="alert">{speechError}</p>}

      {showSettings && (
        <div className="tts-settings-panel">
          <div className="tts-field">
            <label htmlFor="tts-voice-select">Voice Speaker:</label>
            <select
              id="tts-voice-select"
              value={selectedVoice}
              onChange={(e) => handleVoiceChange(e.target.value)}
            >
              {voices.length === 0 && <option value="">Default System Voice</option>}
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang}) {v.default ? "— Default" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="tts-slider-grid">
            <div className="tts-field">
              <label htmlFor="tts-speed">Speed ({rate.toFixed(1)}x):</label>
              <input
                id="tts-speed"
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={rate}
                onChange={(e) => handleRateChange(parseFloat(e.target.value))}
              />
            </div>

            <div className="tts-field">
              <label htmlFor="tts-pitch">Pitch ({pitch.toFixed(1)}):</label>
              <input
                id="tts-pitch"
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={pitch}
                onChange={(e) => handlePitchChange(parseFloat(e.target.value))}
              />
            </div>

            <div className="tts-field">
              <label htmlFor="tts-volume">Volume ({Math.round(volume * 100)}%):</label>
              <input
                id="tts-volume"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              />
            </div>
          </div>

          <div className="tts-test-btns">
            <button type="button" className="tts-test-btn" onClick={handleTestAudio}>
              🔊 Test Speech Voice
            </button>
            <button type="button" className="tts-test-btn secondary" onClick={handleChimeTest}>
              🔔 Test Audio Chime
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
