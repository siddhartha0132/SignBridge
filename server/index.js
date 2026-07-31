// Minimal Express backend. Its only job is: hold the NVIDIA_API_KEY,
// call the NVIDIA NIM API (MiniMax-M3), and return small, feature-specific JSON
// shapes to the frontend. Keeping model calls here (not in the browser)
// means the key is never exposed and rate limiting/caching can be added
// in exactly one place later.
import express from "express";

const PORT = process.env.PORT || 8787;
const API_KEY = process.env.NVIDIA_API_KEY;
const MODEL = process.env.NVIDIA_MODEL || "minimaxai/minimax-m3";
const INVOKE_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

const app = express();
app.use(express.json({ limit: "8mb" })); // photos as base64 need headroom

async function callNvidiaLLM(messages, maxTokens = 300) {
  if (!API_KEY) {
    throw new Error("NVIDIA_API_KEY is not set. See .env.example.");
  }
  
  const payload = {
    model: MODEL,
    messages: messages,
    temperature: 0.7,
    top_p: 0.95,
    max_tokens: maxTokens,
    stream: false
  };
  
  const res = await fetch(INVOKE_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`NVIDIA API error: ${res.status} ${errorText}`);
  }
  
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// Sign-to-sentence reconstruction
app.post("/api/reconstruct", async (req, res) => {
  try {
    const { words, recentHistory } = req.body;
    const prompt = [
      "You reconstruct sign-language word sequences into one natural, grammatically",
      "correct spoken sentence. Only output the sentence, nothing else.",
      recentHistory?.length ? `Recent conversation: ${recentHistory.join(" | ")}` : "",
      `Signed words in order: ${words.join(", ")}`,
    ]
      .filter(Boolean)
      .join("\n");
    const sentence = await callNvidiaLLM([{ role: "user", content: prompt }], 120);
    res.json({ sentence: sentence.trim() });
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
});

// Emotion-aware caption tagging
app.post("/api/emotion", async (req, res) => {
  try {
    const { transcript } = req.body;
    const prompt = [
      "Classify the emotional tone of this spoken sentence as exactly one word",
      'from: calm, happy, urgent, upset, angry, neutral. Then give one emoji.',
      'Respond ONLY as JSON: {"label": "...", "emoji": "..."}',
      `Sentence: "${transcript}"`,
    ].join("\n");
    const raw = await callNvidiaLLM([{ role: "user", content: prompt }], 60);
    const cleaned = raw.replace(/```json|```/g, "").trim();
    res.json(JSON.parse(cleaned));
  } catch (err) {
    res.status(500).json({ error: String(err.message || err), label: "neutral", emoji: "💬" });
  }
});

// Describe-my-surroundings captioning (Vision API)
app.post("/api/describe", async (req, res) => {
  try {
    const { image } = req.body;
    
    // NVIDIA NIM vision - MiniMax-M3 supports vision
    const messages = [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${image}`
            }
          },
          {
            type: "text",
            text: "Describe this scene in two short, plain spoken sentences for a person who " +
                  "cannot see it. Mention obstacles, people, and anything relevant to moving " +
                  "around safely. Do not mention that it's an image."
          }
        ]
      }
    ];
    
    const description = await callNvidiaLLM(messages, 150);
    res.json({ description: description.trim() });
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
});

// Emergency alert relay stub — wire this up to Twilio/SendGrid/etc. for a
// real deployment. Left as a safe no-op-with-logging for the prototype.
app.post("/api/alert", (req, res) => {
  console.log("[DISTRESS ALERT]", req.body);
  res.json({ ok: true });
});

app.listen(PORT, () => console.log(`SignBridge backend on :${PORT}`));
