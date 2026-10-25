"use client";

import { useEffect, useState, type FormEvent } from "react";
import { site, modeCopy } from "@/site.config";
import { smsHref, telHref, whatsappHref } from "@/lib/links";
import { ESTIMATE_EVENT, type EstimateSelection } from "./PriceCalculator";
import { MessageIcon, PhoneIcon, WhatsAppIcon } from "./Icons";

export default function Booking() {
  const copy = modeCopy[site.mode];
  const vehicles = site.calculator.vehicles.map((v) => v.label);
  const services = site.services.map((s) => s.name);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicle, setVehicle] = useState(vehicles[0] ?? "");
  const [service, setService] = useState(services[0] ?? "");
  const [date, setDate] = useState("");
  const [details, setDetails] = useState("");
  const [estimate, setEstimate] = useState<number | null>(null);
  const [sent, setSent] = useState(false);

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

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = encodeURIComponent(buildMessage());
    window.location.href = `${smsHref}?&body=${body}`;
    setSent(true);
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
          <button type="submit" className="btn btn--accent btn--block">Send booking request</button>
          {sent ? (
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
