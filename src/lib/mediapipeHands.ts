import {
  FilesetResolver,
  HandLandmarker,
  type HandLandmarkerResult,
} from "@mediapipe/tasks-vision";

let landmarker: HandLandmarker | null = null;

// Loads the MediaPipe WASM runtime + hand landmark model once and reuses it.
// This is the ONLY place that talks to MediaPipe — every other module
// consumes plain landmark arrays, so swapping models later (e.g. a two-hand
// or higher-fps model) only touches this file.
export async function getHandLandmarker(): Promise<HandLandmarker> {
  if (landmarker) return landmarker;

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
  );

  landmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numHands: 1,
  });

  return landmarker;
}

export function detectForVideo(
  video: HTMLVideoElement,
  timestampMs: number
): HandLandmarkerResult | null {
  if (!landmarker) return null;
  return landmarker.detectForVideo(video, timestampMs);
}
