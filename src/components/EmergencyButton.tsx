import { useState } from "react";

const KEY = "signbridge:trusted-contact";

export function EmergencyContactSetup() {
  const [name, setName] = useState(() => localStorage.getItem(`${KEY}:name`) ?? "");
  const [phone, setPhone] = useState(() => localStorage.getItem(`${KEY}:phone`) ?? "");
  const [saved, setSaved] = useState(false);

  function save() {
    localStorage.setItem(`${KEY}:name`, name);
    localStorage.setItem(`${KEY}:phone`, phone);
    setSaved(true);
  }

  return (
    <section aria-label="Emergency contact settings" className="feature-container">
      <div className="feature-panel" style={{ borderLeft: "4px solid var(--accent-amber)" }}>
        <p style={{ color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
          Held-fist gesture for 3 seconds anywhere in the app opens a confirmation to alert this
          contact. Nothing is sent without your explicit confirmation.
        </p>
      </div>

      <div className="feature-panel">
        <div style={{ marginBottom: "1.5rem" }}>
          <label htmlFor="contact-name" className="tool-label">Trusted Contact Name</label>
          <input 
            id="contact-name" 
            className="tool-input"
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="e.g. Jane Doe"
          />
        </div>

        <div>
          <label htmlFor="contact-phone" className="tool-label">Trusted Contact Phone</label>
          <input 
            id="contact-phone" 
            className="tool-input"
            value={phone} 
            onChange={(e) => setPhone(e.target.value)} 
            placeholder="e.g. +1 555 0123"
          />
        </div>

        <div className="feature-actions" style={{ marginTop: "2rem" }}>
          <button className="primary-btn" onClick={save} style={{ background: "linear-gradient(135deg, #f43f5e, #ec4899)", color: "white" }}>
            Save SOS Contact
          </button>
          {saved && <p role="status" style={{ color: "var(--accent-emerald)", fontWeight: 600, margin: 0 }}>✓ Saved successfully.</p>}
        </div>
      </div>
    </section>
  );
}
