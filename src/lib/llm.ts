// Every LLM call goes through OUR backend (server/index.js), never straight
// to the API from the browser. This file includes local smart fallbacks so that
// SignBridge always works smoothly even if the backend server is offline or missing keys.

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

/**
 * Local fallback rule to reconstruct a clean sentence from word list
 * if backend server or LLM API is offline or unreachable.
 */
function localReconstructFallback(words: string[]): string {
  if (!words || words.length === 0) return "";

  // Remove consecutive duplicates (e.g. ["hello", "hello", "please"] -> ["hello", "please"])
  const deduplicated: string[] = [];
  for (const w of words) {
    if (!w) continue;
    if (deduplicated.length === 0 || deduplicated[deduplicated.length - 1].toLowerCase() !== w.toLowerCase()) {
      deduplicated.push(w);
    }
  }

  if (deduplicated.length === 0) return "";

  // Natural formatting: Capitalize first word, join remaining cleanly
  const formatted = deduplicated.map((w, idx) => {
    const clean = w.trim().toLowerCase();
    if (idx === 0) {
      return clean.charAt(0).toUpperCase() + clean.slice(1);
    }
    return clean;
  });

  let sentence = formatted.join(" ");
  if (!sentence.endsWith(".") && !sentence.endsWith("!") && !sentence.endsWith("?")) {
    sentence += ".";
  }
  return sentence;
}

// Sign-to-sentence: turn a buffered sequence of recognized words into a
// natural, grammatical sentence. Recent sentence history is included so
// pronouns/context can carry across turns.
export async function reconstructSentence(
  words: string[],
  recentHistory: string[]
): Promise<string> {
  if (!words || words.length === 0) return "";
  try {
    const { sentence, error } = await post<{ sentence?: string; error?: string }>("/api/reconstruct", {
      words,
      recentHistory,
    });
    if (sentence && sentence.trim()) {
      return sentence.trim();
    }
    if (error) {
      console.warn("Backend reconstruct returned error, using local fallback:", error);
    }
  } catch (err) {
    console.warn("Backend reconstruct fetch failed, using local fallback:", err);
  }

  return localReconstructFallback(words);
}

// Emotion-aware captioning: classify the tone of a hearing person's spoken
// transcript so the non-hearing user sees a tone tag alongside the caption.
export async function tagEmotion(
  transcript: string
): Promise<{ label: string; emoji: string }> {
  try {
    return await post("/api/emotion", { transcript });
  } catch (err) {
    console.warn("Emotion tag fetch failed, using neutral fallback:", err);
    return { label: "neutral", emoji: "💬" };
  }
}
