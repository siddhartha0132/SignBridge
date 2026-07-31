// Captures a frame from a <video> element and sends it to the backend for
// captioning. Kept separate from the gesture pipeline (mediapipeHands.ts) —
// they both use a camera, but never at the same time (see App.tsx mode
// state machine), so there's no contention over the device.

// Max dimension for the image sent to the vision API.
// Keeping it at 512px cuts payload ~85% vs a full 1280×720 frame with
// no meaningful loss in scene-description quality.
const MAX_DIM = 512;

export function captureFrame(video: HTMLVideoElement): string {
  const srcW = video.videoWidth;
  const srcH = video.videoHeight;

  // Scale down while preserving aspect ratio
  const scale = Math.min(1, MAX_DIM / Math.max(srcW, srcH));
  const w = Math.round(srcW * scale);
  const h = Math.round(srcH * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(video, 0, 0, w, h);
  // quality 0.75 is plenty for scene description and keeps base64 small
  return canvas.toDataURL("image/jpeg", 0.75).split(",")[1];
}

export async function describeImage(base64Jpeg: string): Promise<string> {
  const res = await fetch("/api/describe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: base64Jpeg }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText);
    throw new Error(`Scene description failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  if (!data.description) {
    throw new Error("Scene description API returned an empty response.");
  }
  return data.description;
}
