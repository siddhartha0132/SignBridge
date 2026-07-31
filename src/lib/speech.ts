// Thin wrapper around the browser's native Web Speech API. Kept separate
// from every other module so the two-way conversation loop (Conversation.tsx)
// and the "describe surroundings" TTS playback both go through the exact
// same speak()/listen() functions — one implementation, no drift.

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

export function speak(text: string, opts?: { rate?: number; pitch?: number }) {
  if (!isTTSSupported()) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = opts?.rate ?? 1;
  utterance.pitch = opts?.pitch ?? 1;
  window.speechSynthesis.cancel(); // one voice at a time, never overlap
  window.speechSynthesis.speak(utterance);
}
