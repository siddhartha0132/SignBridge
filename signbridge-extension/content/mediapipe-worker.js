// Runs in the MAIN world (see manifest.json "world": "MAIN").
//
// Why this file exists: MediaPipe's HandLandmarker.createFromOptions()
// loads its WASM module by injecting <script src="vision_wasm_internal.js">
// into document.head. That script sets a top-level `var ModuleFactory`,
// which becomes a property of whatever window it executes in. Injected
// <script> tags always execute in the page's MAIN world, never in a
// content script's isolated world — so if this init code ran in the
// isolated world (like overlay.js does), it would never see ModuleFactory
// and would fail with "ModuleFactory not set." Running this file itself
// in the MAIN world puts both halves in the same global, so it works.
//
// Trade-off: MAIN-world scripts have no access to chrome.* APIs. So this
// file receives pre-resolved chrome-extension:// URLs from overlay.js
// (which does have chrome.runtime access) via a CustomEvent, and reports
// results back the same way.

(function () {
  // Google Meet enforces Trusted Types (require-trusted-types-for 'script'),
  // which blocks raw-string assignment to script.src — including the one
  // MediaPipe's internal WASM loader does. Registering a permissive
  // 'default' policy makes the browser auto-wrap legacy string assignments
  // instead of blocking them. This only works if the page's CSP doesn't
  // restrict trusted-types to a specific allow-list that excludes 'default'
  // (some sites do — if so, this will throw and we fall back gracefully).
  if (window.trustedTypes?.createPolicy && !window.trustedTypes.defaultPolicy) {
    try {
      window.trustedTypes.createPolicy('default', {
        createScriptURL: (url) => url,
        createScript: (script) => script,
        createHTML: (html) => html,
      });
      console.log('✅ SignBridge: registered default Trusted Types policy');
    } catch (err) {
      console.warn('⚠️ SignBridge: could not register default Trusted Types policy (page may restrict policy names):', err.message);
    }
  }

  let handLandmarker = null;
  let mediaPipeModule = null;

  function reportStatus(status, detail) {
    window.dispatchEvent(new CustomEvent('signbridge:status', { detail: { status, detail } }));
  }

  function reportGesture(gesture) {
    window.dispatchEvent(new CustomEvent('signbridge:gesture', { detail: { gesture } }));
  }

  async function loadMediaPipeModule(bundleUrl) {
    mediaPipeModule = await import(bundleUrl);
    if (!mediaPipeModule?.FilesetResolver || !mediaPipeModule?.HandLandmarker) {
      throw new Error('Expected exports missing from vision bundle');
    }
  }

  function detectFingers(points) {
    // points[0] = wrist
    // points[4,8,12,16,20] = finger tips
    // points[3,6,10,14,18] = finger PIP (middle joint)
    // A finger is "extended" if tip is significantly further from wrist than PIP
    const wrist = points[0];
    
    return [4, 8, 12, 16, 20].map((tip, i) => {
      const pipIdx = [3, 6, 10, 14, 18][i];
      // Distance from wrist to tip
      const tipDist = Math.hypot(points[tip].x - wrist.x, points[tip].y - wrist.y);
      // Distance from wrist to PIP
      const pipDist = Math.hypot(points[pipIdx].x - wrist.x, points[pipIdx].y - wrist.y);
      // Finger is extended if tip is much further than PIP
      return tipDist > pipDist * 1.2;
    });
  }

  function matchGesture(fingers) {
    const patterns = [
      { p: [true, true, true, true, true], w: 'hello', desc: '👋 Open palm - all fingers extended' },
      { p: [false, false, false, false, false], w: 'stop', desc: '✋ Closed fist - no fingers extended' },
      { p: [true, false, false, false, false], w: 'yes', desc: '👍 Thumbs up - only thumb extended' },
      { p: [false, true, true, false, false], w: 'please', desc: '☮️ Peace sign - index & middle extended' },
      { p: [false, true, false, false, false], w: 'wait', desc: '☝️ Pointing - only index finger extended' },
      { p: [true, true, false, false, true], w: 'love', desc: '🤟 Love sign - thumb, index & pinky extended' },
    ];

    for (const { p, w, desc } of patterns) {
      if (fingers.every((v, i) => v === p[i])) {
        return { gesture: w, description: desc };
      }
    }
    return null;
  }

  let isActive = false;
  let videoElement = null;
  let rafId = null;
  let lastWord = null;

  async function findVideo() {
    const videos = Array.from(document.querySelectorAll('video')).filter(
      (v) => v.readyState >= 2 && v.videoWidth > 0
    );

    if (videos.length > 0) {
      // On Google Meet, pick the largest video (usually your own feed)
      const v = videos.reduce((best, current) => {
        const bestArea = best.videoWidth * best.videoHeight;
        const currentArea = current.videoWidth * current.videoHeight;
        return currentArea > bestArea ? current : best;
      });

      console.log('🎥 SignBridge selected largest page video (area ' + (v.videoWidth * v.videoHeight) + '):', {
        width: v.videoWidth,
        height: v.videoHeight,
        id: v.id,
        className: v.className,
        paused: v.paused,
        muted: v.muted,
      });

      if (videos.length > 1) {
        console.warn('⚠️ SignBridge: ' + videos.length + ' video elements found on page. Using largest. Other candidates:',
          videos.map(vi => ({ width: vi.videoWidth, height: vi.videoHeight, area: vi.videoWidth * vi.videoHeight, id: vi.id, className: vi.className })));
      }

      return v;
    }

    console.log('🎥 SignBridge: no usable page video found, opening dedicated webcam stream...');

    const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
    const video = document.createElement('video');
    video.srcObject = stream;
    video.autoplay = true;
    video.muted = true;
    video.style.display = 'none';
    document.body.appendChild(video);
    await video.play();
    return video;
  }

  let frameCount = 0;

  function detectLoop() {
    if (!isActive || !videoElement || !handLandmarker) return;
    if (videoElement.readyState < 2) {
      rafId = requestAnimationFrame(detectLoop);
      return;
    }

    try {
      const results = handLandmarker.detectForVideo(videoElement, performance.now());

      frameCount++;

      if (frameCount % 60 === 0) {
        console.log('🔍 SignBridge frame ' + frameCount + ': hands detected = ' + (results?.landmarks?.length || 0) + ', video ' + videoElement.videoWidth + 'x' + videoElement.videoHeight + ', paused=' + videoElement.paused);
      }

      if (results?.landmarks?.[0]) {
        const fingers = detectFingers(results.landmarks[0]);
        const gestureResult = matchGesture(fingers);

        if (frameCount % 30 === 0) {
          if (gestureResult) {
            console.log('✋ SignBridge finger states:', fingers, '→', gestureResult.description);
          } else {
            console.log('✋ SignBridge finger states:', fingers, '→ gesture match: none');
          }
        }

        if (gestureResult && gestureResult.gesture !== lastWord) {
          lastWord = gestureResult.gesture;
          reportGesture(gestureResult.gesture);
        }
      }
    } catch (err) {
      reportStatus('detection-error', err.message);
    }

    rafId = requestAnimationFrame(detectLoop);
  }

  async function start({ bundleUrl, wasmPath, modelUrl }) {
    try {
      reportStatus('loading', 'Importing vision bundle...');
      await loadMediaPipeModule(bundleUrl);

      reportStatus('loading', 'Resolving WASM fileset...');
      const wasmFileset = await mediaPipeModule.FilesetResolver.forVisionTasks(wasmPath);

      reportStatus('loading', 'Creating HandLandmarker...');
      handLandmarker = await mediaPipeModule.HandLandmarker.createFromOptions(wasmFileset, {
        baseOptions: { modelAssetPath: modelUrl, delegate: 'CPU' },
        runningMode: 'VIDEO',
        numHands: 1,
        minHandDetectionConfidence: 0.5,
      });

      reportStatus('loading', 'Opening camera...');
      videoElement = await findVideo();

      isActive = true;
      reportStatus('ready');
      detectLoop();
    } catch (err) {
      reportStatus('error', err.message);
    }
  }

  function stop() {
    isActive = false;
    if (rafId) cancelAnimationFrame(rafId);
    reportStatus('stopped');
  }

  window.addEventListener('signbridge:start', (e) => start(e.detail));
  window.addEventListener('signbridge:stop', stop);
})();
