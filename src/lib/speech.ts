// Thin wrapper around the browser's native Web Speech API and Web Audio API fallback.
// Kept separate so all components (SignToSentence, Conversation, DescribeSurroundings)
// go through the exact same bulletproof speak()/listen() functions.

type SpeechRecognitionLike = typeof window extends { webkitSpeechRecognition: infer T }
  ? T
  : any;

export function isSTTSupported(): boolean {
  return "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
}

export function isTTSSupported(): boolean {
  return "speechSynthesis" in window;
}

let recognition: any = null;

export function listen(
  onResult: (transcript: string, isFinal: boolean) => void,
  onEnd?: () => void
): () => void {
  const Ctor: SpeechRecognitionLike =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!Ctor) {
    throw new Error("Speech recognition is not supported in this browser.");
  }

  recognition = new Ctor();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  recognition.onresult = (event: any) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      onResult(result[0].transcript, result.isFinal);
    }
  };
  recognition.onend = () => onEnd?.();
  recognition.start();

  return () => recognition?.stop();
}

export function stopListening() {
  recognition?.stop();
  recognition = null;
}

// ─────────────────────────────────────────────────────────────────────────────
// TTS Engine & Voice Management
// ─────────────────────────────────────────────────────────────────────────────

export interface TTSOptions {
  rate?: number; // 0.5 to 2
  pitch?: number; // 0.5 to 1.5
  volume?: number; // 0 to 1
  voiceURI?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

let availableVoices: SpeechSynthesisVoice[] = [];
let defaultOptions: TTSOptions = {
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
};

let speakingListeners = new Set<(isSpeaking: boolean) => void>();
let isSpeakingState = false;
let chromeKeepAliveTimer: any = null;

function setSpeaking(speaking: boolean) {
  isSpeakingState = speaking;
  speakingListeners.forEach((cb) => cb(speaking));
}

export function subscribeSpeakingState(cb: (isSpeaking: boolean) => void): () => void {
  speakingListeners.add(cb);
  cb(isSpeakingState);
  return () => {
    speakingListeners.delete(cb);
  };
}

export function loadVoices(): SpeechSynthesisVoice[] {
  if (!isTTSSupported()) return [];
  availableVoices = window.speechSynthesis.getVoices();
  return availableVoices;
}

if (isTTSSupported()) {
  loadVoices();
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => {
      loadVoices();
    };
  }
}

export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (availableVoices.length === 0) {
    loadVoices();
  }
  return availableVoices;
}

/**
 * Crucial for Chromium browsers: Must be called synchronously inside a click event handler
 * to pre-warm / unlock Web Speech API user activation before an asynchronous LLM/fetch call.
 */
export function primeSpeech() {
  if (!isTTSSupported()) return;
  try {
    window.speechSynthesis.resume();
    // Speak a micro-utterance with 0 volume to unlock audio context in Chrome/Safari
    const silentUtterance = new SpeechSynthesisUtterance("");
    silentUtterance.volume = 0;
    window.speechSynthesis.speak(silentUtterance);
  } catch (e) {
    console.warn("Speech synthesis priming warning:", e);
  }
}

function startChromeKeepAlive() {
  stopChromeKeepAlive();
  chromeKeepAliveTimer = setInterval(() => {
    if (isTTSSupported() && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    } else {
      stopChromeKeepAlive();
    }
  }, 10000);
}

function stopChromeKeepAlive() {
  if (chromeKeepAliveTimer) {
    clearInterval(chromeKeepAliveTimer);
    chromeKeepAliveTimer = null;
  }
}

/**
 * Fallback Web Audio API chime generator in case browser Web Speech API fails or is muted.
 */
export function playFallbackChime() {
  try {
    const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextCtor) return;
    const ctx = new AudioContextCtor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15); // E5
    osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.3); // G5

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {
    console.warn("Fallback chime error:", e);
  }
}

export function stopSpeech() {
  if (!isTTSSupported()) return;
  stopChromeKeepAlive();
  window.speechSynthesis.cancel();
  setSpeaking(false);
}

export function speak(text: string, opts?: TTSOptions) {
  if (!text || !text.trim()) return;
  if (!isTTSSupported()) {
    playFallbackChime();
    opts?.onError?.(new Error("Web Speech API is not supported in this browser."));
    return;
  }

  // Cancel any ongoing utterance to ensure clean restart
  stopSpeech();
  window.speechSynthesis.resume();

  const utterance = new SpeechSynthesisUtterance(text);
  const rate = opts?.rate ?? defaultOptions.rate ?? 1.0;
  const pitch = opts?.pitch ?? defaultOptions.pitch ?? 1.0;
  const volume = opts?.volume ?? defaultOptions.volume ?? 1.0;

  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.volume = volume;

  // Voice Selection
  const voices = getAvailableVoices();
  let selectedVoice: SpeechSynthesisVoice | undefined;

  if (opts?.voiceURI) {
    selectedVoice = voices.find((v) => v.voiceURI === opts.voiceURI);
  }

  if (!selectedVoice && defaultOptions.voiceURI) {
    selectedVoice = voices.find((v) => v.voiceURI === defaultOptions.voiceURI);
  }

  if (!selectedVoice) {
    // Prefer English voices if available, otherwise default voice
    selectedVoice =
      voices.find((v) => v.lang.startsWith("en") && v.default) ||
      voices.find((v) => v.lang.startsWith("en")) ||
      voices[0];
  }

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  utterance.onstart = () => {
    setSpeaking(true);
    opts?.onStart?.();
    startChromeKeepAlive();
  };

  utterance.onend = () => {
    setSpeaking(false);
    stopChromeKeepAlive();
    opts?.onEnd?.();
  };

  utterance.onerror = (event) => {
    console.error("SpeechSynthesis error:", event);
    setSpeaking(false);
    stopChromeKeepAlive();
    // Fall back to chime so user gets audio cue if speech failed
    playFallbackChime();
    opts?.onError?.(event);
  };

  window.speechSynthesis.speak(utterance);

  // Chrome safety check: if speech didn't start within 100ms, force resume
  setTimeout(() => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  }, 100);
}

export function setDefaultTTSOptions(options: Partial<TTSOptions>) {
  defaultOptions = { ...defaultOptions, ...options };
}

export function getDefaultTTSOptions(): TTSOptions {
  return { ...defaultOptions };
}
