import { cosineSimilarity, preprocessLandmarks, type Point } from "./landmarks";
import { listCustomGestures } from "./gestureStore";
import { matchBuiltIn } from "./builtInGestures";

export type ClassificationResult = {
  word: string;
  confidence: number;
  source: "custom" | "built-in";
} | null;

const CUSTOM_MATCH_THRESHOLD = 0.85;

// Single entry point every recognition surface (sign-to-sentence mode,
// conversation mode, sign trainer preview) calls into. Keeping ONE classifier
// function means built-in and custom gestures can never disagree silently —
// there is one ranked decision per frame.
export function classifyLandmarks(points: Point[]): ClassificationResult {
  const vector = preprocessLandmarks(points);

  // 1. Custom (user-trained) gestures take priority — they're specific to
  //    this user and were taught deliberately, so a confident match should
  //    win over the generic built-in patterns.
  const custom = listCustomGestures();
  let best: { word: string; score: number } | null = null;
  for (const gesture of custom) {
    for (const sample of gesture.samples) {
      const score = cosineSimilarity(vector, sample);
      if (!best || score > best.score) best = { word: gesture.word, score };
    }
  }
  if (best && best.score >= CUSTOM_MATCH_THRESHOLD) {
    return { word: best.word, confidence: best.score, source: "custom" };
  }

  // 2. Fall back to the built-in rule-based starter vocabulary.
  const builtIn = matchBuiltIn(points);
  if (builtIn) {
    return { word: builtIn.word, confidence: builtIn.confidence, source: "built-in" };
  }

  return null;
}
