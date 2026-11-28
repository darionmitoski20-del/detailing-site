"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { DEFAULT_SECTIONS, site as demoSite, type Service, type SiteConfig } from "@/site.config";
import { DEFAULT_WEEK, groupHours } from "@/lib/hours";
import { asset } from "@/lib/asset";
import type { Admin, Onboarding } from "./useAdmin";

const COLORS = ["#E11D2E", "#F97316", "#EAB308", "#16A34A", "#0EA5E9", "#2563EB", "#7C3AED", "#DB2777", "#111827", "#B8860B"];

type Preset = { name: string; price: number; description: string; on: boolean };
const demoImage = (name: string) => demoSite.services.find((s) => s.name === name)?.image;
const PRESETS: Preset[] = [
  { name: "Full Detail", price: 375, on: true, description: "Our most popular package. Interior and exterior, restored to showroom condition." },
  { name: "Interior Detail", price: 245, on: true, description: "Deep vacuum, shampoo, steam, leather care and glass. Smells new again." },
  { name: "Exterior Detail", price: 155, on: true, description: "Foam hand wash, wheels and tires, decontamination and sealant." },
  { name: "Ceramic Coating", price: 899, on: true, description: "Long-term gloss and protection that makes every wash easier." },
  { name: "Paint Correction", price: 450, on: false, description: "Machine polishing to remove swirls, light scratches and water spots." },
  { name: "Odor Removal", price: 95, on: false, description: "Enzyme and ozone treatment for smoke, pets and spills." },
  { name: "Engine Bay Cleaning", price: 60, on: false, description: "Safe degreasing and dressing for a clean, like-new engine bay." },
  { name: "Headlight Restoration", price: 80, on: false, description: "Removes yellow haze so headlights look clear and shine brighter." },
];
const STEPS = ["Your business", "Website address", "Services & prices", "Where you work", "Logo & color", "Photos & links"];
const LAST = STEPS.length; // index of the "done" screen
const REGISTRARS = ["GoDaddy", "Wix", "Squarespace", "Namecheap", "Google / Squarespace Domains", "Hostinger", "Other / not sure"];

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "service";
}
function digits(s: string) {
  const d = s.replace(/\D/g, "");
  return d.length === 10 ? `1${d}` : d;
}

/** First visit of a new detailer: builds their website in 4 short steps. */
export default function SetupWizard({ a }: { a: Admin }) {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [siteId, setSiteId] = useState<string | null>(a.site?.id ?? null);

  const [name, setName] = useState(a.site?.name ?? "");
  const [mode, setMode] = useState<"mobile" | "studio">("mobile");
  const [city, setCity] = useState("");
  const [state, setState] = useState("NJ");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(a.session?.user.email ?? "");
  const [years, setYears] = useState("5");

  const [services, setServices] = useState<Preset[]>(PRESETS);
  const [extra, setExtra] = useState("");

  const [towns, setTowns] = useState<string[]>([]);
  const [town, setTown] = useState("");
  const [mapsLink, setMapsLink] = useState("");

  const [hasDomain, setHasDomain] = useState<boolean | null>(null);
  const [domain, setDomain] = useState("");
  const [registrar, setRegistrar] = useState("");
  const [ideas, setIdeas] = useState(["", "", ""]);

  const [photos, setPhotos] = useState<string[]>([]);
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [booking, setBooking] = useState<"form" | "other">("form");
  const [bookingUrl, setBookingUrl] = useState("");
  const [notes, setNotes] = useState("");

  const [logo, setLogo] = useState<string | undefined>();
  const [color, setColor] = useState(COLORS[0]);
  const [uploading, setUploading] = useState(false);

  async function nextFromBusiness(e: FormEvent) {
    e.preventDefault();
    if (!siteId) {
      setBusy(true);
      const id = await a.createMySite(name.trim());
      setBusy(false);
      if (!id) return;
      setSiteId(id);
      await a.loadSites(); // so uploads go into this new site's folder
    }
    if (mode === "mobile" && towns.length === 0 && city.trim()) setTowns([city.trim()]);
    setStep(1);
  }

  function addTown() {
    const t = town.trim();
    if (t && !towns.includes(t)) setTowns([...towns, t]);
    setTown("");
  }

  async function addPhotos(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).slice(0, 12 - photos.length);
    e.target.value = "";
    if (!files.length) return;
    setUploading(true);
    const urls: string[] = [];
    for (const f of files) {
      const u = await a.upload(f, "photos");
      if (u) urls.push(u);
    }
    setUploading(false);
    setPhotos((p) => [...p, ...urls].slice(0, 12));
  }

  async function pickLogo(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setUploading(true);
    const u = await a.upload(f, "logo");
    setUploading(false);
    if (u) setLogo(u);
  }

  function build(): SiteConfig {
    const chosen: Service[] = services
      .filter((s) => s.on && s.name.trim())
      .map((s) => ({ name: s.name.trim(), from: s.price, description: s.description, image: demoImage(s.name) }));
    const calcServices = chosen.slice(0, 4).map((s) => ({ id: slug(s.name), label: s.name, price: s.from }));
    const n = name.trim();
    return {
      ...demoSite,
      mode,
      business: {
        ...demoSite.business,
        name: n,
        initial: (n.charAt(0) || "D").toUpperCase(),
        logo,
        tagline: mode === "mobile" ? "Mobile car detailing" : "Car detailing studio",
        city: city.trim(),
        state: state.trim().toUpperCase(),
        address: mode === "studio" ? address.trim() : "",
        serviceArea: mode === "mobile" ? (towns.length ? towns : [city.trim()]) : [],
        yearsExperience: Number(years) || 1,
        hours: groupHours(DEFAULT_WEEK),
        url: "",
      },
      contact: {
        phoneDisplay: phone.trim(),
        phone: digits(phone),
        whatsapp: "",
        email: email.trim(),
        bookingUrl: booking === "other" ? bookingUrl.trim() : "",
        instagram: instagram.trim(),
        facebook: facebook.trim(),
        googleReviewsUrl: "",
      },
      theme: { accent: color },
      rating: { score: 5, count: 0 },
      services: chosen,
      calculator: {
        ...demoSite.calculator,
        services: calcServices.length ? calcServices : demoSite.calculator.services,
        defaults: { vehicle: "sedan", service: calcServices[0]?.id ?? demoSite.calculator.defaults.service, condition: "average" },
      },
      gallery: [],
      reviews: [],
      photos,
      maps: mapsLink.trim() ? { link: mapsLink.trim() } : undefined,
      hoursWeek: DEFAULT_WEEK,
      sections: DEFAULT_SECTIONS,
    };
  }

  async function finish() {
    if (!siteId) return;
    setBusy(true);
    const onboarding: Onboarding = {
      hasDomain: Boolean(hasDomain),
      domain: hasDomain ? domain.trim().toLowerCase() : undefined,
      registrar: hasDomain ? registrar : undefined,
      domainIdeas: hasDomain ? undefined : ideas.map((x) => x.trim().toLowerCase()).filter(Boolean),
      bookingSystem: booking === "other" ? bookingUrl.trim() || "other system" : undefined,
      notes: notes.trim() || undefined,
    };
    const ok = await a.finishOnboarding(siteId, build(), onboarding);
    setBusy(false);
    if (ok) setStep(LAST);
  }

  const canNextServices = services.some((s) => s.on && s.name.trim());

  return (
    <div className="adm-wiz">
      <div className="adm-wiz__card">
        <div className="adm-brand"><span className="adm-brand__mark">A</span> AutoDetailWeb</div>
        {step < LAST && (
          <>
            <div className="adm-wiz__progress" aria-hidden="true"><span style={{ width: `${((step + 1) / LAST) * 100}%` }} /></div>
            <p className="adm-muted adm-small">Step {step + 1} of {LAST} · {STEPS[step]}</p>
          </>
        )}
        {a.error && <p className="adm-error">{a.error}</p>}

        {step === 0 && (
          <form onSubmit={nextFromBusiness}>
            <h1>Let’s build your website</h1>
            <p className="adm-muted">Takes about 3 minutes. You can change everything later.</p>
            <label className="adm-field"><span>Business name</span><input required minLength={2} value={name} onChange={(e) => setName(e.target.value)} placeholder="Mike’s Mobile Detailing" disabled={Boolean(siteId)} /></label>
            <div className="adm-field">
              <span>How do you work?</span>
              <div className="adm-seg">
                <button type="button" className={mode === "mobile" ? "is-on" : ""} onClick={() => setMode("mobile")}>I come to the customer</button>
                <button type="button" className={mode === "studio" ? "is-on" : ""} onClick={() => setMode("studio")}>Customers come to my shop</button>
              </div>
            </div>
            <div className="adm-grid2">
              <label className="adm-field"><span>City</span><input required value={city} onChange={(e) => setCity(e.target.value)} placeholder="Clifton" /></label>
              <label className="adm-field"><span>State</span><input required maxLength={2} value={state} onChange={(e) => setState(e.target.value.toUpperCase())} /></label>
            </div>
            {mode === "studio" && <label className="adm-field"><span>Shop address</span><input required value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St, Clifton, NJ 07011" /></label>}
            <div className="adm-grid2">
              <label className="adm-field"><span>Business phone</span><input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(201) 555-0000" /></label>
              <label className="adm-field"><span>Years in business</span><input inputMode="numeric" value={years} onChange={(e) => setYears(e.target.value.replace(/\D/g, ""))} /></label>
            </div>
            <label className="adm-field"><span>Email for booking requests</span><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            <button className="adm-btn adm-btn--primary adm-btn--full" disabled={busy}>{busy ? "Creating…" : "Next"}</button>
          </form>
        )}

        {step === 1 && (
          <div>
            <h1>Your website address</h1>
            <p className="adm-muted">Do you already own a domain (like mikesdetailing.com)?</p>
            <div className="adm-seg" style={{ marginBottom: 16 }}>
              <button type="button" className={hasDomain === true ? "is-on" : ""} onClick={() => setHasDomain(true)}>Yes, I have one</button>
              <button type="button" className={hasDomain === false ? "is-on" : ""} onClick={() => setHasDomain(false)}>No, get me one</button>
            </div>
            {hasDomain === true && (
              <>
                <label className="adm-field"><span>Your domain</span><input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="mikesdetailing.com" /></label>
                <label className="adm-field"><span>Where did you buy it?</span>
                  <select value={registrar} onChange={(e) => setRegistrar(e.target.value)}>
                    <option value="">Choose…</option>
                    {REGISTRARS.map((x) => <option key={x}>{x}</option>)}
                  </select>
                </label>
                <p className="adm-muted adm-small">We will connect it for you and tell you exactly what to click.</p>
              </>
            )}
            {hasDomain === false && (
              <>
                <p className="adm-muted adm-small">Write up to 3 names you like. We check which one is free and set it up for you.</p>
                {ideas.map((v, i) => (
                  <label key={i} className="adm-field"><span>Idea {i + 1}{i === 0 ? "" : " (optional)"}</span>
                    <input value={v} onChange={(e) => setIdeas(ideas.map((x, j) => (j === i ? e.target.value : x)))} placeholder={i === 0 ? `${slug(name).replace(/-/g, "")}.com` : ""} />
                  </label>
                ))}
              </>
            )}
            <div className="adm-wiz__nav">
              <button type="button" className="adm-btn adm-btn--ghost" onClick={() => setStep(0)}>Back</button>
              <button type="button" className="adm-btn adm-btn--primary" disabled={hasDomain === null || (hasDomain ? !domain.trim() : !ideas[0].trim())} onClick={() => setStep(2)}>Next</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1>Your services</h1>
            <p className="adm-muted">Tick what you offer and set your starting price (“from $”).</p>
            <div className="adm-wiz__services">
              {services.map((s, i) => (
                <label key={i} className={`adm-wiz__svc ${s.on ? "is-on" : ""}`}>
                  <input type="checkbox" checked={s.on} onChange={(e) => setServices(services.map((x, j) => (j === i ? { ...x, on: e.target.checked } : x)))} />
                  <span className="adm-wiz__svcname">{s.name}</span>
                  <span className="adm-money"><i>$</i><input inputMode="numeric" aria-label={`${s.name} price`} value={String(s.price)} onChange={(e) => setServices(services.map((x, j) => (j === i ? { ...x, price: Number(e.target.value.replace(/\D/g, "")) || 0, on: true } : x)))} /></span>
                </label>
              ))}
            </div>
            <div className="adm-inline" style={{ marginTop: 10 }}>
              <input className="adm-input" value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="Another service (e.g. Boat Detail)" />
              <button type="button" className="adm-btn adm-btn--ghost" onClick={() => { if (extra.trim()) { setServices([...services, { name: extra.trim(), price: 100, on: true, description: "" }]); setExtra(""); } }}>Add</button>
            </div>
            <div className="adm-wiz__nav">
              <button type="button" className="adm-btn adm-btn--ghost" onClick={() => setStep(1)}>Back</button>
              <button type="button" className="adm-btn adm-btn--primary" disabled={!canNextServices} onClick={() => setStep(3)}>Next</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h1>Where you work</h1>
            {mode === "mobile" ? (
              <>
                <p className="adm-muted">Towns you drive to. They show on your website.</p>
                <div className="adm-chips">
                  {towns.map((t) => <span key={t} className="adm-chip is-on">{t} <button type="button" aria-label={`Remove ${t}`} onClick={() => setTowns(towns.filter((x) => x !== t))}>×</button></span>)}
                </div>
                <div className="adm-inline">
                  <input className="adm-input" value={town} onChange={(e) => setTown(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTown(); } }} placeholder="Add a town" />
                  <button type="button" className="adm-btn adm-btn--ghost" onClick={addTown}>Add</button>
                </div>
              </>
            ) : (
              <p className="adm-muted">Your shop: <b>{address}</b></p>
            )}
            <label className="adm-field" style={{ marginTop: 16 }}>
              <span>Google Maps link (optional)</span>
              <input value={mapsLink} onChange={(e) => setMapsLink(e.target.value)} placeholder="https://maps.app.goo.gl/…" />
            </label>
            <p className="adm-muted adm-small">Open Google Maps, find your business, press Share → Copy link. Your website shows a map with directions.</p>
            <p className="adm-muted adm-small">Opening hours start as Mon–Sat 8 AM – 6 PM. You can change them later.</p>
            <div className="adm-wiz__nav">
              <button type="button" className="adm-btn adm-btn--ghost" onClick={() => setStep(2)}>Back</button>
              <button type="button" className="adm-btn adm-btn--primary" onClick={() => setStep(4)}>Next</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h1>Logo & color</h1>
            <div className="adm-brandrow" style={{ marginTop: 8 }}>
              <div className={`adm-upload ${logo ? "has-media" : ""}`}>
                {logo ? <img src={asset(logo)} alt="" /> : <span className="adm-upload__plus">+</span>}
                <span className="adm-upload__label">{uploading ? "Uploading…" : logo ? "Change" : "Logo"}</span>
                <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={pickLogo} disabled={uploading} aria-label="Upload logo" />
              </div>
              <div>
                <p className="adm-small adm-muted">No logo? Skip it — we show your first letter in your color.</p>
                <div className="adm-swatches">
                  {COLORS.map((c) => <button key={c} type="button" className={`adm-swatch ${color === c ? "is-on" : ""}`} style={{ background: c }} aria-label={`Color ${c}`} onClick={() => setColor(c)} />)}
                </div>
              </div>
            </div>
            <div className="adm-wiz__nav">
              <button type="button" className="adm-btn adm-btn--ghost" onClick={() => setStep(3)}>Back</button>
              <button type="button" className="adm-btn adm-btn--primary" disabled={uploading} onClick={() => setStep(5)}>Next</button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <h1>Photos & links</h1>
            <p className="adm-muted">All optional — you can add them later too.</p>
            <div className="adm-field"><span>Photos of your work (up to 12)</span></div>
            <div className="adm-photos">
              {photos.map((p, i) => (
                <div key={p + i} className="adm-photo">
                  <img src={asset(p)} alt="" />
                  <button type="button" className="adm-upload__remove" aria-label="Remove photo" onClick={() => setPhotos(photos.filter((_, j) => j !== i))}>×</button>
                </div>
              ))}
              {photos.length < 12 && (
                <div className="adm-upload">
                  <span className="adm-upload__plus">+</span>
                  <span className="adm-upload__label">{uploading ? "Uploading…" : "Add photos"}</span>
                  <input type="file" accept="image/*" multiple onChange={addPhotos} disabled={uploading} aria-label="Add photos" />
                </div>
              )}
            </div>
            <div className="adm-grid2" style={{ marginTop: 16 }}>
              <label className="adm-field"><span>Instagram link</span><input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/…" /></label>
              <label className="adm-field"><span>Facebook link</span><input value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="https://facebook.com/…" /></label>
            </div>
            <div className="adm-field">
              <span>How do customers book with you?</span>
              <div className="adm-seg">
                <button type="button" className={booking === "form" ? "is-on" : ""} onClick={() => setBooking("form")}>Use the website’s form</button>
                <button type="button" className={booking === "other" ? "is-on" : ""} onClick={() => setBooking("other")}>I use Square / Calendly / other</button>
              </div>
            </div>
            {booking === "other" && <label className="adm-field"><span>Your booking link</span><input value={bookingUrl} onChange={(e) => setBookingUrl(e.target.value)} placeholder="https://…" /></label>}
            <label className="adm-field"><span>Anything else we should know? (optional)</span><textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
            <div className="adm-wiz__nav">
              <button type="button" className="adm-btn adm-btn--ghost" onClick={() => setStep(4)}>Back</button>
              <button type="button" className="adm-btn adm-btn--primary" disabled={busy || uploading} onClick={finish}>{busy ? "Building your website…" : "Create my website"}</button>
            </div>
          </div>
        )}

        {step === LAST && (
          <div>
            <h1>Your website is ready 🎉</h1>
            <p className="adm-muted">Your free 14-day trial has started. We will email you the link to your live website within 24 hours.</p>
            <ul className="adm-wiz__next">
              <li>Add photos of your work and before &amp; after pictures</li>
              <li>Check your prices and opening hours</li>
              <li>Booking requests from customers show up in your admin</li>
            </ul>
            <div className="adm-wiz__nav">
              <button type="button" className="adm-btn adm-btn--ghost" onClick={a.openPreview}>See my website</button>
              <button type="button" className="adm-btn adm-btn--primary" onClick={() => a.loadSites()}>Go to my admin</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
