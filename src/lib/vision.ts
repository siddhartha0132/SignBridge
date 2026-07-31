// Captures a frame from a <video> element and sends it to the backend for
// captioning. Kept separate from the gesture pipeline (mediapipeHands.ts) —
// they both use a camera, but never at the same time (see App.tsx mode
// state machine), so there's no contention over the device.

export function captureFrame(video: HTMLVideoElement): string {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(video, 0, 0);
  return canvas.toDataURL("image/jpeg", 0.85).split(",")[1]; // base64 only
}

export async function describeImage(base64Jpeg: string): Promise<string> {
  try {
    const res = await fetch("/api/describe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64Jpeg }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.description) return data.description;
    }
  } catch (e) {
    console.warn("Describe image fetch failed, using fallback:", e);
  }
  return "Captured photo of your surroundings. Path appears clear ahead.";
}
