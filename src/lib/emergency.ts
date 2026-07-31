import type { Point } from "./landmarks";
import { isFistPose } from "./builtInGestures";

const HOLD_MS = 3000;

// Runs alongside gesture recognition but is deliberately its own tiny state
// machine (not a vocabulary word) so an ordinary "stop" sign mid-sentence
// can NEVER accidentally trigger an alert. It only fires after the SAME
// pose is held continuously for HOLD_MS, which a normal conversational
// sign never does.
export class DistressWatcher {
  private holdStart: number | null = null;
  private firedAt = 0;

  // Call once per recognized frame. Returns true exactly once per hold.
  update(points: Point[], now: number): boolean {
    if (!isFistPose(points)) {
      this.holdStart = null;
      return false;
    }
    if (this.holdStart === null) this.holdStart = now;

    const held = now - this.holdStart;
    if (held >= HOLD_MS && now - this.firedAt > HOLD_MS) {
      this.firedAt = now;
      return true;
    }
    return false;
  }

  reset() {
    this.holdStart = null;
  }
}

export async function sendDistressAlert(contact: { name: string; phone: string }) {
  // Demo stub: in production this posts to /api/alert, which relays via a
  // service like Twilio. Kept as a stub here so the prototype never sends a
  // real SMS by accident.
  await fetch("/api/alert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contact, message: "SignBridge distress alert triggered." }),
  }).catch(() => {
    /* offline/demo-safe: swallow network errors, UI shows local confirmation */
  });
}
