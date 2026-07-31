// A single aria-live region (declared once in index.html) that every mode
// writes to. Centralizing this means two features can never fight over
// separate live regions or step on each other's screen-reader announcements.
export function announce(message: string) {
  const el = document.getElementById("sr-live");
  if (!el) return;
  el.textContent = ""; // force re-announcement even if text is repeated
  window.requestAnimationFrame(() => {
    el.textContent = message;
  });
}
