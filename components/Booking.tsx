"use client";

import { useEffect, useState, type FormEvent } from "react";
import { modeCopy, type SiteConfig } from "@/site.config";
import { links } from "@/lib/links";
import { hasBackend, SITE_ID, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/siteData";
import { ESTIMATE_EVENT, type EstimateSelection } from "./PriceCalculator";
import { MessageIcon, PhoneIcon, WhatsAppIcon } from "./Icons";

export default function Booking({ site }: { site: SiteConfig }) {
  const { smsHref, telHref, whatsappHref } = links(site);
  const copy = modeCopy[site.mode];
  const vehicles = site.calculator.vehicles.map((v) => v.label);
  const services = site.services.filter((s) => !s.hidden).map((s) => s.name);
  const online = hasBackend && Boolean(SITE_ID);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicle, setVehicle] = useState(vehicles[0] ?? "");
  const [service, setService] = useState(services[0] ?? "");
  const [date, setDate] = useState("");
  const [details, setDetails] = useState("");
  const [estimate, setEstimate] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);

  // Pre-fill from the price calculator ("Book this detail")
  useEffect(() => {
    function onPick(e: Event) {
      const d = (e as CustomEvent<EstimateSelection>).detail;
      if (vehicles.includes(d.vehicle)) setVehicle(d.vehicle);
      const match = services.find((s) => s.toLowerCase().includes(d.service.toLowerCase()) || d.service.toLowerCase().includes(s.toLowerCase()));
      if (match) setService(match);
      setEstimate(d.total);
    }
    window.addEventListener(ESTIMATE_EVENT, onPick);
    return () => window.removeEventListener(ESTIMATE_EVENT, onPick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function buildMessage() {
    return [
      `Booking request — ${site.business.name}`,
      `Name: ${name}`,
      `Phone: ${phone}`,
      `Vehicle: ${vehicle}`,
      `Service: ${service}`,
      estimate ? `Website estimate: $${estimate}` : "",
      date ? `Preferred date: ${date}` : "",
      details ? `${copy.addressLabel}: ${details}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!online) {
      // Demo / no database: open a text message with the details.
      window.location.href = `${smsHref}?&body=${encodeURIComponent(buildMessage())}`;
      setSent(true);
      return;
    }
    setSending(true);
    setFailed(false);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          site_id: SITE_ID,
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || null,
          vehicle,
          service,
          estimate: estimate ?? null,
          preferred_date: date || null,
          details: details.trim() || null,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setSent(true);
    } catch {
      setFailed(true);
    } finally {
      setSending(false);
    }
  }

  const mailHref = `mailto:${site.contact.email}?subject=${encodeURIComponent("Booking request")}&body=${encodeURIComponent(buildMessage())}`;

  return (
    <section id="book" className="section book">
      <div className="container book__grid">
        <div className="book__intro">
          <h2 className="h2">Ready for that new-car feeling?</h2>
          <p>Book online in a minute, or reach us the way you prefer.</p>
          <div className="book__links">
            <a href={telHref} className="btn btn--white"><PhoneIcon /> Call {site.contact.phoneDisplay}</a>
            <a href={smsHref} className="btn btn--ghost"><MessageIcon /> Text us</a>
            {whatsappHref ? (
              <a href={whatsappHref} className="btn btn--ghost" target="_blank" rel="noopener noreferrer"><WhatsAppIcon /> WhatsApp</a>
            ) : null}
          </div>
        </div>

        <form className="form" onSubmit={onSubmit} aria-label="Booking request">
          <h3>Request a booking</h3>
          {estimate ? (
            <p className="form__note" style={{ fontWeight: 600 }}>Your website estimate: ${estimate.toLocaleString("en-US")}</p>
          ) : null}
          <div className="form__row">
            <label className="field">Name
              <input type="text" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </label>
            <label className="field">Phone
              <input type="tel" required autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(000) 000-0000" />
            </label>
          </div>
          {online ? (
            <label className="field">Email (optional, for a confirmation)
              <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
            </label>
          ) : null}
          <div className="form__row">
            <label className="field">Vehicle
              <select value={vehicle} onChange={(e) => setVehicle(e.target.value)}>
                {vehicles.map((v) => <option key={v}>{v}</option>)}
              </select>
            </label>
            <label className="field">Service
              <select value={service} onChange={(e) => setService(e.target.value)}>
                {services.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
          </div>
          <div className="form__row">
            <label className="field">Preferred date
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <label className="field">{copy.addressLabel}
              <input type="text" value={details} onChange={(e) => setDetails(e.target.value)} placeholder={copy.addressPlaceholder} />
            </label>
          </div>
          <button type="submit" className="btn btn--accent btn--block" disabled={sending}>
            {sending ? "Sending…" : "Send booking request"}
          </button>
          {online && sent ? (
            <p className="form__ok" role="status">Thanks! We got your request and will text you to confirm.</p>
          ) : online && failed ? (
            <p className="form__ok" role="alert" style={{ background: "#fef2f2", color: "#991b1b" }}>
              Could not send right now. Please <a href={smsHref}>text us</a> or call {site.contact.phoneDisplay}.
            </p>
          ) : online ? (
            <p className="form__note">We confirm by text during business hours.</p>
          ) : sent ? (
            <p className="form__ok" role="status">
              Your messaging app should open with the request ready to send. Not working?{" "}
              <a href={mailHref}>Send it by email instead</a>.
            </p>
          ) : (
            <p className="form__note">Opens a text message with your details. We confirm by text during business hours.</p>
          )}
        </form>
      </div>
    </section>
  );
}
