import { useEffect, useRef, useState } from "react";

// Every mode that needs the camera uses this SAME hook. Because it always
// stops its tracks on unmount, switching modes in App.tsx (which unmounts
// the previous mode's component) always releases the camera before the
// next mode's instance of this hook requests it again — no two modes can
// ever hold the camera at once.
export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play();
          setReady(true);
        }
      })
      .catch((err) => setError(err.message ?? "Camera unavailable"));

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return { videoRef, ready, error };
}
