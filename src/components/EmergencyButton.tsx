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
    <section aria-label="Emergency contact settings">
      <p>
        Held-fist gesture for 3 seconds anywhere in the app opens a confirmation to alert this
        contact. Nothing is sent without your confirmation.
      </p>
      <label htmlFor="contact-name">Trusted contact name</label>
      <input id="contact-name" value={name} onChange={(e) => setName(e.target.value)} />

      <label htmlFor="contact-phone">Trusted contact phone</label>
      <input id="contact-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />

      <button className="primary-btn" onClick={save}>
        Save contact
      </button>
      {saved && <p role="status">Saved.</p>}
    </section>
  );
}
