// Landmark preprocessing
//
// MediaPipe's HandLandmarker gives 21 (x, y, z) points per hand, in image-
// relative [0,1] coordinates. Raw coordinates are useless for classification
// because they shift with hand position and camera distance. We normalize
// the same way the reference implementation does:
//   1. Re-origin every point relative to the wrist (landmark 0).
//   2. Flatten to a single vector.
//   3. Scale every value by the largest absolute value in the vector.
// The result is a 42-dimensional vector (x,y for 21 points) that is
// translation- and scale-invariant, so the same "open hand" sign classifies
// correctly whether it's close to the camera or far away.

export type Point = { x: number; y: number; z?: number };

export function preprocessLandmarks(points: Point[]): number[] {
  if (!points.length) return [];

  const baseX = points[0].x;
  const baseY = points[0].y;

  const relative: number[] = [];
  for (const p of points) {
    relative.push(p.x - baseX, p.y - baseY);
  }

  const maxAbs = relative.reduce((m, v) => Math.max(m, Math.abs(v)), 0) || 1;
  return relative.map((v) => v / maxAbs);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return -1;
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return -1;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
