import type { Point } from "./landmarks";

// Landmark indices (MediaPipe Hands convention)
const WRIST = 0;
const THUMB_TIP = 4,
  THUMB_IP = 3;
const FINGERS = [
  { tip: 8, pip: 6 }, // index
  { tip: 12, pip: 10 }, // middle
  { tip: 16, pip: 14 }, // ring
  { tip: 20, pip: 18 }, // pinky
];

function dist(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// Returns [thumb, index, middle, ring, pinky] as booleans (true = extended).
// This is a geometric heuristic, not a trained model — good enough to ship
// a usable starter vocabulary with zero training data. The personal sign
// trainer (kNN classifier) is what gets you real accuracy for anything
// beyond these five words.
export function fingerStates(points: Point[]): boolean[] {
  const wrist = points[WRIST];
  const fourFingers = FINGERS.map(
    ({ tip, pip }) => dist(points[tip], wrist) > dist(points[pip], wrist) * 1.15
  );
  const thumbExtended =
    dist(points[THUMB_TIP], points[17]) > dist(points[THUMB_IP], points[17]) * 1.1;
  return [thumbExtended, ...fourFingers];
}

export type BuiltInMatch = { word: string; confidence: number };

// Static-pose starter vocabulary. Each entry is a fixed [thumb,i,m,r,p]
// extension pattern. Real ASL/ISL words are far richer (motion, orientation,
// non-manual markers) — this is intentionally a minimal "works immediately"
// demo set, meant to be extended via the Personal Sign Trainer, not a
// substitute for full sign language coverage.
const PATTERNS: { pattern: boolean[]; word: string }[] = [
  { pattern: [true, true, true, true, true], word: "hello" },
  { pattern: [false, false, false, false, false], word: "stop" },
  { pattern: [true, false, false, false, false], word: "yes" },
  { pattern: [false, true, true, false, false], word: "please" },
  { pattern: [false, true, false, false, false], word: "wait" },
  { pattern: [true, true, false, false, true], word: "i-love-you" },
];

export function matchBuiltIn(points: Point[]): BuiltInMatch | null {
  const state = fingerStates(points);
  for (const { pattern, word } of PATTERNS) {
    const matches = pattern.every((v, i) => v === state[i]);
    if (matches) return { word, confidence: 0.75 };
  }
  return null;
}

// The distress gesture is deliberately NOT in the word vocabulary above.
// It's a separate, sustained-hold check (see emergency.ts) so a normal
// "stop" sign in the middle of a sentence can never accidentally fire it.
export function isFistPose(points: Point[]): boolean {
  return fingerStates(points).every((v) => v === false);
}
