// Every LLM call goes through OUR backend (server/index.js), never straight
// to the Anthropic API from the browser — that's the only place the API key
// lives. This file is intentionally the single choke point other modules use,
// so if you swap models or add caching/rate-limiting later, it happens here.

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return res.json();
}

// Sign-to-sentence: turn a buffered sequence of recognized words into a
// natural, grammatical sentence. Recent sentence history is included so
// pronouns/context can carry across turns.
export async function reconstructSentence(
  words: string[],
  recentHistory: string[]
): Promise<string> {
  const { sentence } = await post<{ sentence: string }>("/api/reconstruct", {
    words,
    recentHistory,
  });
  return sentence;
}

// Emotion-aware captioning: classify the tone of a hearing person's spoken
// transcript so the non-hearing user sees a tone tag alongside the caption.
export async function tagEmotion(
  transcript: string
): Promise<{ label: string; emoji: string }> {
  return post("/api/emotion", { transcript });
}
