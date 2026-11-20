"use client";

import { useState, type FormEvent } from "react";
import { offer } from "@/offer.config";

/** Lead form for detailers. Opens a text message to you with everything filled in. */
export default function LeadForm() {
  const [name, setName] = useState("");
  const [business, setBusiness] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [pkg, setPkg] = useState(offer.packages.find((p) => p.popular)?.name ?? offer.packages[0].name);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = [
      "Website request",
      `Name: ${name}`,
      `Business: ${business}`,
      `Phone: ${phone}`,
      city ? `City: ${city}` : "",
      `Package: ${pkg}`,
      message ? `Message: ${message}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    window.location.href = `sms:+${offer.contact.phone}?&body=${encodeURIComponent(body)}`;
    setSent(true);
  }

  return (
    <form className="form" onSubmit={onSubmit} aria-label="Website request">
      <h3>Get your website</h3>
      <div className="form__row">
        <label className="field">Your name
          <input type="text" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
        </label>
        <label className="field">Business name
          <input type="text" required value={business} onChange={(e) => setBusiness(e.target.value)} placeholder="e.g. Shine Pro Detailing" />
        </label>
      </div>
      <div className="form__row">
        <label className="field">Phone
          <input type="tel" required autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(000) 000-0000" />
        </label>
        <label className="field">City
          <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Town, state" />
        </label>
      </div>
      <label className="field">Package
        <select value={pkg} onChange={(e) => setPkg(e.target.value)}>
          {offer.packages.map((p) => <option key={p.id}>{p.name}</option>)}
        </select>
      </label>
      <label className="field">Anything else? (optional)
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Instagram link, current website, questions..." />
      </label>
      <button type="submit" className="btn btn--accent btn--block">Send request</button>
      {sent ? (
        <p className="form__ok" role="status">
          Your messaging app should open with the request ready to send. Not working? Call{" "}
          <a href={`tel:+${offer.contact.phone}`}>{offer.contact.phoneDisplay}</a>.
        </p>
      ) : (
        <p className="form__note">Opens a text message with your details. We reply the same day.</p>
      )}
    </form>
  );
}
