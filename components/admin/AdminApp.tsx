"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { SECTION_LABELS, type SiteConfig } from "@/site.config";
import { resolveSections } from "@/components/SiteView";
import { WEEK_DAYS } from "@/lib/hours";
import { asset } from "@/lib/asset";
import { mapEmbedSrc } from "@/lib/maps";
import { PHOTO_LIMIT, useAdmin, type Admin, type BookingRow, type BookingStatus } from "./useAdmin";

type Tab = "requests" | "services" | "photos" | "business" | "sections";

const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: "requests", label: "Requests", icon: <Ico d="M4 4h16v12H5.2L4 17.2V4zm3 4h10M7 11h7" /> },
  { id: "services", label: "Services & prices", icon: <Ico d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8zM7.5 7.5h.01" /> },
  { id: "photos", label: "Photos & video", icon: <Ico d="M3 5h18v14H3zM8.5 10.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 19" /> },
  { id: "business", label: "Business info", icon: <Ico d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" /> },
  { id: "sections", label: "Sections", icon: <Ico d="M4 5h16M4 12h16M4 19h16" /> },
];

const SWATCHES = ["#E11D2E", "#F97316", "#EAB308", "#16A34A", "#0EA5E9", "#2563EB", "#7C3AED", "#DB2777", "#111827", "#B8860B"];

function Ico({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export default function AdminApp({ demo = false }: { demo?: boolean }) {
  const a = useAdmin(demo);

  if (a.phase === "loading") return <div className="adm-center"><div className="adm-spinner" aria-label="Loading" /></div>;
  if (a.phase === "signedOut") return <Login a={a} />;
  if (a.phase === "pending") return <Pending a={a} />;
  return <Shell a={a} />;
}

/* ============================== Login ============================== */

function Login({ a }: { a: Admin }) {
  const [mode, setMode] = useState<"login" | "request">("login");
  const [email, setEmail] = useState("");
  const [business, setBusiness] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "requested">("idle");
  const [msg, setMsg] = useState("");

  async function sendLink(e: FormEvent) {
    e.preventDefault();
    setState("sending");
    setMsg("");
    const r = await a.signIn(email);
    if (r.ok) setState("sent");
    else {
      setState("idle");
      setMsg(r.message);
    }
  }

  async function sendRequest(e: FormEvent) {
    e.preventDefault();
    setState("sending");
    const r = await a.requestAccess({ email: email.trim(), business: business.trim(), phone: phone.trim() });
    if (r.ok) setState("requested");
    else {
      setState("idle");
      setMsg(r.message || "Something went wrong. Please try again.");
    }
  }

  return (
    <div className="adm-login">
      <div className="adm-login__card">
        <div className="adm-brand"><span className="adm-brand__mark">D</span> Detailer Admin</div>

        {state === "sent" ? (
          <>
            <h1>Check your email</h1>
            <p className="adm-muted">We sent a login link to <b>{email}</b>. Open it on this device. It works once and expires in 1 hour.</p>
            <button className="adm-btn adm-btn--ghost" onClick={() => setState("idle")}>Use a different email</button>
          </>
        ) : state === "requested" ? (
          <>
            <h1>Request sent</h1>
            <p className="adm-muted">Thanks! We will set up your website and email you at <b>{email}</b> when your admin is ready.</p>
            <button className="adm-btn adm-btn--ghost" onClick={() => { setMode("login"); setState("idle"); }}>Back to login</button>
          </>
        ) : mode === "login" ? (
          <form onSubmit={sendLink}>
            <h1>Log in</h1>
            <p className="adm-muted">No password. We email you a link.</p>
            <label className="adm-field">
              <span>Email</span>
              <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@yourbusiness.com" />
            </label>
            {msg && <p className="adm-error">{msg}</p>}
            <button className="adm-btn adm-btn--primary adm-btn--full" disabled={state === "sending"}>
              {state === "sending" ? "Sending…" : "Send me a login link"}
            </button>
            <p className="adm-muted adm-center-text">New here? <button type="button" className="adm-link" onClick={() => setMode("request")}>Request access</button></p>
            <a className="adm-btn adm-btn--ghost adm-btn--full" href="?demo">Just looking? Try the demo admin</a>
          </form>
        ) : (
          <form onSubmit={sendRequest}>
            <h1>Request access</h1>
            <p className="adm-muted">Tell us about your business. We will approve you and set up your website.</p>
            <label className="adm-field"><span>Business name</span><input required value={business} onChange={(e) => setBusiness(e.target.value)} /></label>
            <label className="adm-field"><span>Phone</span><input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
            <label className="adm-field"><span>Email</span><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            {msg && <p className="adm-error">{msg}</p>}
            <button className="adm-btn adm-btn--primary adm-btn--full" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Send request"}</button>
            <p className="adm-muted adm-center-text"><button type="button" className="adm-link" onClick={() => setMode("login")}>I already have an account</button></p>
          </form>
        )}
      </div>
    </div>
  );
}

function Pending({ a }: { a: Admin }) {
  return (
    <div className="adm-login">
      <div className="adm-login__card">
        <div className="adm-brand"><span className="adm-brand__mark">D</span> Detailer Admin</div>
        <h1>Waiting for approval</h1>
        <p className="adm-muted">You are logged in as <b>{a.session?.user.email}</b>, but this email is not connected to a website yet. We will email you as soon as it is ready.</p>
        {a.error && <p className="adm-error">{a.error}</p>}
        <button className="adm-btn adm-btn--ghost" onClick={a.signOut}>Log out</button>
      </div>
    </div>
  );
}

/* ============================== Shell ============================== */

function Shell({ a }: { a: Admin }) {
  const tabs = a.plan !== "basic" || a.platformAdmin ? TABS : TABS.filter((t) => t.id === "requests");
  const [tab, setTab] = useState<Tab>("requests");
  const newCount = a.bookings.filter((b) => b.status === "new").length;
  const name = a.draft.business.name;

  return (
    <div className="adm">
      <aside className="adm-side">
        <div className="adm-brand"><span className="adm-brand__mark">{(name.charAt(0) || "D").toUpperCase()}</span> {name}</div>
        <nav>
          {tabs.map((t) => (
            <button key={t.id} className={`adm-nav ${tab === t.id ? "is-on" : ""}`} onClick={() => setTab(t.id)}>
              {t.icon}
              <span>{t.label}</span>
              {t.id === "requests" && newCount > 0 && <em className="adm-badge">{newCount}</em>}
            </button>
          ))}
        </nav>
        <div className="adm-side__foot">
          {a.sites.length > 1 && (
            <label className="adm-field adm-field--dark">
              <span>Website</span>
              <select value={a.siteId || ""} onChange={(e) => a.setSiteId(e.target.value)}>
                {a.sites.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.plan}{s.active ? "" : " (paused)"}</option>)}
              </select>
            </label>
          )}
          <div className="adm-muted adm-small">{a.demo ? "Demo mode" : a.session?.user.email}</div>
          {!a.demo && <button className="adm-link adm-link--light" onClick={a.signOut}>Log out</button>}
        </div>
      </aside>

      <div className="adm-main">
        <header className="adm-top">
          <h2>{tabs.find((t) => t.id === tab)?.label}</h2>
          {(a.plan !== "basic" || a.platformAdmin) && (!a.locked || a.platformAdmin) && (
            <div className="adm-top__actions">
              {a.saving ? <span className="adm-pill">Saving…</span> : a.dirty ? <span className="adm-pill adm-pill--warn">Unpublished changes</span> : <span className="adm-pill adm-pill--ok">Live</span>}
              <button className="adm-btn adm-btn--ghost" onClick={a.openPreview}>Preview</button>
              <button className="adm-btn adm-btn--primary" onClick={a.publish} disabled={!a.dirty}>Publish</button>
            </div>
          )}
        </header>

        {a.demo && <div className="adm-banner">This is a demo. Try anything — changes are not saved. <a className="adm-link" href="./">Exit demo</a></div>}
        {a.locked && (
          <div className="adm-banner adm-banner--danger">
            Your admin is paused because the payment is overdue. Your website is still online. Please contact us to renew and unlock editing.
          </div>
        )}
        {a.error && (
          <div className="adm-banner adm-banner--danger" role="alert">
            {a.error} <button className="adm-link" onClick={() => a.setError(null)}>Dismiss</button>
          </div>
        )}

        <div className="adm-content">
          {tab === "requests" && <Requests a={a} />}
          {tab === "services" && <ServicesPanel a={a} />}
          {tab === "photos" && <PhotosPanel a={a} />}
          {tab === "business" && <BusinessPanel a={a} />}
          {tab === "sections" && <SectionsPanel a={a} />}
        </div>
      </div>

      <nav className="adm-tabbar">
        {tabs.map((t) => (
          <button key={t.id} className={tab === t.id ? "is-on" : ""} onClick={() => setTab(t.id)}>
            {t.icon}
            <span>{t.label.split(" ")[0]}</span>
            {t.id === "requests" && newCount > 0 && <em className="adm-badge">{newCount}</em>}
          </button>
        ))}
      </nav>

      {a.toast && <div className="adm-toast" role="status">{a.toast}</div>}
    </div>
  );
}

/* ============================== Requests ============================== */

const STATUS_LABEL: Record<BookingStatus, string> = { new: "New", confirmed: "Confirmed", done: "Done" };

function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${Math.max(mins, 1)} min ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "Yesterday" : `${d} days ago`;
}

function Requests({ a }: { a: Admin }) {
  const [filter, setFilter] = useState<BookingStatus | "all">("all");
  const list = filter === "all" ? a.bookings : a.bookings.filter((b) => b.status === filter);

  useEffect(() => {
    if (a.demo) return;
    const t = setInterval(() => a.refreshBookings(), 60000);
    return () => clearInterval(t);
  }, [a]);

  return (
    <>
      <div className="adm-chips">
        {(["all", "new", "confirmed", "done"] as const).map((f) => (
          <button key={f} className={`adm-chip ${filter === f ? "is-on" : ""}`} onClick={() => setFilter(f)}>
            {f === "all" ? "All" : STATUS_LABEL[f]} <b>{f === "all" ? a.bookings.length : a.bookings.filter((b) => b.status === f).length}</b>
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <div className="adm-empty">No requests here yet. When a customer fills the booking form on your website, it shows up here and in your email.</div>
      ) : (
        <div className="adm-list">{list.map((b) => <BookingCard key={b.id} b={b} a={a} />)}</div>
      )}
    </>
  );
}

function BookingCard({ b, a }: { b: BookingRow; a: Admin }) {
  const tel = b.phone.replace(/[^\d+]/g, "");
  return (
    <article className={`adm-card adm-booking is-${b.status}`}>
      <div className="adm-booking__head">
        <div>
          <h3>{b.name}</h3>
          <div className="adm-muted adm-small">{timeAgo(b.created_at)}</div>
        </div>
        <span className={`adm-status adm-status--${b.status}`}>{STATUS_LABEL[b.status]}</span>
      </div>
      <dl className="adm-dl">
        {b.service && <><dt>Service</dt><dd>{b.service}</dd></>}
        {b.vehicle && <><dt>Vehicle</dt><dd>{b.vehicle}</dd></>}
        {b.estimate != null && <><dt>Estimate</dt><dd>${b.estimate}</dd></>}
        {b.preferred_date && <><dt>When</dt><dd>{b.preferred_date}</dd></>}
        {b.details && <><dt>Notes</dt><dd>{b.details}</dd></>}
        {b.email && <><dt>Email</dt><dd><a href={`mailto:${b.email}`}>{b.email}</a></dd></>}
      </dl>
      <div className="adm-booking__actions">
        <a className="adm-btn adm-btn--primary" href={`tel:${tel}`}>Call {b.phone}</a>
        <a className="adm-btn adm-btn--ghost" href={`sms:${tel}`}>Text</a>
        <select className="adm-select" value={b.status} onChange={(e) => a.setBookingStatus(b.id, e.target.value as BookingStatus)} aria-label="Status">
          <option value="new">New</option>
          <option value="confirmed">Confirmed</option>
          <option value="done">Done</option>
        </select>
      </div>
    </article>
  );
}

/* ============================== Shared bits ============================== */

function Card({ title, hint, children, right }: { title: string; hint?: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="adm-card">
      <div className="adm-card__head">
        <div>
          <h3>{title}</h3>
          {hint && <p className="adm-muted adm-small">{hint}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={`adm-field ${wide ? "adm-field--wide" : ""}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} className={`adm-toggle ${on ? "is-on" : ""}`} onClick={() => onChange(!on)}>
      <span />
    </button>
  );
}

function Money({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <span className="adm-money">
      <i>$</i>
      <input inputMode="numeric" aria-label={label} value={Number.isFinite(value) ? String(value) : ""} onChange={(e) => onChange(Number(e.target.value.replace(/[^\d.]/g, "")) || 0)} />
    </span>
  );
}

/** Square that shows a photo and lets you pick a new one. */
function UploadBox({ a, url, folder, onUrl, label, accept = "image/*", video, small }: {
  a: Admin; url?: string; folder: string; onUrl: (url: string | undefined) => void; label: string; accept?: string; video?: boolean; small?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const disabled = !a.canEdit;
  async function pick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    const u = await a.upload(file, folder);
    setBusy(false);
    if (u) onUrl(u);
  }
  return (
    <div className={`adm-upload ${small ? "adm-upload--small" : ""} ${url ? "has-media" : ""}`}>
      {url ? (video ? <video src={asset(url)} muted playsInline loop autoPlay /> : <img src={asset(url)} alt="" />) : <span className="adm-upload__plus">+</span>}
      <span className="adm-upload__label">{busy ? "Uploading…" : label}</span>
      <input type="file" accept={accept} onChange={pick} disabled={disabled || busy} aria-label={label} />
      {url && !disabled && (
        <button type="button" className="adm-upload__remove" onClick={() => onUrl(undefined)} aria-label={`Remove ${label}`}>×</button>
      )}
    </div>
  );
}

function slugId(label: string, taken: string[]) {
  const base = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "item";
  let id = base;
  let n = 2;
  while (taken.includes(id)) id = `${base}-${n++}`;
  return id;
}

/* ============================== Services ============================== */

function ServicesPanel({ a }: { a: Admin }) {
  const d = a.draft;
  const set = (fn: (d: SiteConfig) => SiteConfig) => a.update(fn);
  const setService = (i: number, patch: Partial<SiteConfig["services"][number]>) =>
    set((x) => ({ ...x, services: x.services.map((s, j) => (j === i ? { ...s, ...patch } : s)) }));
  const move = (i: number, dir: -1 | 1) =>
    set((x) => {
      const list = [...x.services];
      const j = i + dir;
      if (j < 0 || j >= list.length) return x;
      [list[i], list[j]] = [list[j], list[i]];
      return { ...x, services: list };
    });

  const sections = resolveSections(d);
  const calcOn = sections.find((s) => s.id === "calc")?.on ?? true;
  const setCalcOn = (on: boolean) => set((x) => ({ ...x, sections: resolveSections(x).map((s) => (s.id === "calc" ? { ...s, on } : s)) }));
  const c = d.calculator;
  type Calc = SiteConfig["calculator"];
  const setCalc = (fn: (c: Calc) => Calc) => set((x) => ({ ...x, calculator: fn(x.calculator) }));

  return (
    <fieldset className="adm-stack" disabled={!a.canEdit}>
      <Card title="Services" hint="The cards on your website. Price is the “from $” price.">
        <div className="adm-rows">
          {d.services.map((s, i) => (
            <div key={i} className={`adm-service ${s.hidden ? "is-hidden" : ""}`}>
              <UploadBox a={a} small url={s.image} folder="services" label="Photo" onUrl={(u) => setService(i, { image: u })} />
              <div className="adm-service__fields">
                <div className="adm-grid2">
                  <Field label="Name"><input value={s.name} onChange={(e) => setService(i, { name: e.target.value })} /></Field>
                  <Field label="From price"><Money label="From price" value={s.from} onChange={(v) => setService(i, { from: v })} /></Field>
                </div>
                <Field label="Short description" wide><textarea rows={2} value={s.description} onChange={(e) => setService(i, { description: e.target.value })} /></Field>
              </div>
              <div className="adm-service__side">
                <div className="adm-inline"><Toggle label="Show on website" on={!s.hidden} onChange={(v) => setService(i, { hidden: !v })} /> <span className="adm-small">{s.hidden ? "Hidden" : "Shown"}</span></div>
                <div className="adm-inline">
                  <button type="button" className="adm-icon-btn" onClick={() => move(i, -1)} aria-label="Move up">↑</button>
                  <button type="button" className="adm-icon-btn" onClick={() => move(i, 1)} aria-label="Move down">↓</button>
                  <button type="button" className="adm-icon-btn adm-icon-btn--danger" aria-label="Delete service"
                    onClick={() => { if (window.confirm(`Delete “${s.name}”?`)) set((x) => ({ ...x, services: x.services.filter((_, j) => j !== i) })); }}>🗑</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button type="button" className="adm-btn adm-btn--ghost" onClick={() => set((x) => ({ ...x, services: [...x.services, { name: "New service", from: 100, description: "" }] }))}>+ Add service</button>
      </Card>

      <Card title="Price calculator" hint="Customers pick their car and service and see an estimate." right={<div className="adm-inline"><span className="adm-small">{calcOn ? "On" : "Off"}</span><Toggle label="Calculator on website" on={calcOn} onChange={setCalcOn} /></div>}>
        {calcOn && (
          <div className="adm-calc">
            <div>
              <h4>Base price per service</h4>
              {c.services.map((s, i) => (
                <div key={s.id} className="adm-calc__row">
                  <input value={s.label} aria-label="Service name" onChange={(e) => setCalc((k) => ({ ...k, services: k.services.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) }))} />
                  <Money label={`${s.label} price`} value={s.price} onChange={(v) => setCalc((k) => ({ ...k, services: k.services.map((x, j) => (j === i ? { ...x, price: v } : x)) }))} />
                  <RemoveBtn disabled={c.services.length <= 1} onClick={() => setCalc((k) => ({ ...k, services: k.services.filter((_, j) => j !== i), defaults: { ...k.defaults, service: k.defaults.service === s.id ? k.services.find((x) => x.id !== s.id)!.id : k.defaults.service } }))} />
                </div>
              ))}
              <AddBtn onClick={() => setCalc((k) => ({ ...k, services: [...k.services, { id: slugId("service", k.services.map((x) => x.id)), label: "New service", price: 100 }] }))} />
            </div>
            <div>
              <h4>Vehicle size</h4>
              <p className="adm-muted adm-small">How much more a bigger car costs. 1.2 = 20% more.</p>
              {c.vehicles.map((v, i) => (
                <div key={v.id} className="adm-calc__row">
                  <input value={v.label} aria-label="Vehicle" onChange={(e) => setCalc((k) => ({ ...k, vehicles: k.vehicles.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) }))} />
                  <span className="adm-money"><i>×</i><input inputMode="decimal" aria-label={`${v.label} multiplier`} value={String(v.multiplier)} onChange={(e) => setCalc((k) => ({ ...k, vehicles: k.vehicles.map((x, j) => (j === i ? { ...x, multiplier: Number(e.target.value.replace(/[^\d.]/g, "")) || 1 } : x)) }))} /></span>
                </div>
              ))}
            </div>
            <div>
              <h4>Condition (extra $)</h4>
              {c.conditions.map((v, i) => (
                <div key={v.id} className="adm-calc__row">
                  <input value={v.label} aria-label="Condition" onChange={(e) => setCalc((k) => ({ ...k, conditions: k.conditions.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) }))} />
                  <Money label={`${v.label} extra`} value={v.add} onChange={(n) => setCalc((k) => ({ ...k, conditions: k.conditions.map((x, j) => (j === i ? { ...x, add: n } : x)) }))} />
                </div>
              ))}
            </div>
            <div>
              <h4>Add-ons</h4>
              {c.addons.map((v, i) => (
                <div key={v.id} className="adm-calc__row">
                  <input value={v.label} aria-label="Add-on" onChange={(e) => setCalc((k) => ({ ...k, addons: k.addons.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) }))} />
                  <Money label={`${v.label} price`} value={v.price} onChange={(n) => setCalc((k) => ({ ...k, addons: k.addons.map((x, j) => (j === i ? { ...x, price: n } : x)) }))} />
                  <RemoveBtn onClick={() => setCalc((k) => ({ ...k, addons: k.addons.filter((_, j) => j !== i) }))} />
                </div>
              ))}
              <AddBtn onClick={() => setCalc((k) => ({ ...k, addons: [...k.addons, { id: slugId("addon", k.addons.map((x) => x.id)), label: "New add-on", price: 25 }] }))} />
            </div>
          </div>
        )}
      </Card>
    </fieldset>
  );
}

function RemoveBtn({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return <button type="button" className="adm-icon-btn adm-icon-btn--danger" onClick={onClick} disabled={disabled} aria-label="Remove">×</button>;
}
function AddBtn({ onClick }: { onClick: () => void }) {
  return <button type="button" className="adm-link" onClick={onClick}>+ Add</button>;
}

/* ============================== Photos ============================== */

function PhotosPanel({ a }: { a: Admin }) {
  const d = a.draft;
  const set = a.update;
  const photos = d.photos || [];
  const [busy, setBusy] = useState(false);

  async function addPhotos(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    const room = PHOTO_LIMIT - photos.length;
    if (room <= 0) return;
    setBusy(true);
    const urls: string[] = [];
    for (const f of files.slice(0, room)) {
      const u = await a.upload(f, "photos");
      if (u) urls.push(u);
    }
    setBusy(false);
    if (urls.length) set((x) => ({ ...x, photos: [...(x.photos || []), ...urls].slice(0, PHOTO_LIMIT) }));
  }

  const setPair = (i: number, patch: Partial<SiteConfig["gallery"][number]>) =>
    set((x) => ({ ...x, gallery: x.gallery.map((g, j) => (j === i ? { ...g, ...patch } : g)) }));

  return (
    <fieldset className="adm-stack" disabled={!a.canEdit}>
      <Card title="Top video" hint="Plays at the top of your website. Up to 30 seconds. Vertical or horizontal.">
        <div className="adm-hero">
          <UploadBox a={a} video accept="video/mp4,video/quicktime,video/webm" url={d.hero.video} folder="video" label={d.hero.video ? "Change video" : "Upload video"} onUrl={(u) => set((x) => ({ ...x, hero: { ...x.hero, video: u } }))} />
          <UploadBox a={a} url={d.hero.poster} folder="video" label="Cover photo" onUrl={(u) => set((x) => ({ ...x, hero: { ...x.hero, poster: u } }))} />
        </div>
      </Card>

      <Card title="Before & after" hint="Take both photos of the same car from the same spot.">
        <div className="adm-pairs">
          {d.gallery.map((g, i) => (
            <div key={i} className="adm-pair">
              <div className="adm-pair__boxes">
                <UploadBox a={a} url={g.before} folder="before-after" label="Before" onUrl={(u) => setPair(i, { before: u })} />
                <UploadBox a={a} url={g.after} folder="before-after" label="After" onUrl={(u) => setPair(i, { after: u })} />
              </div>
              <div className="adm-grid2">
                <Field label="Title"><input value={g.label} onChange={(e) => setPair(i, { label: e.target.value })} /></Field>
                <Field label="Caption"><input value={g.caption} onChange={(e) => setPair(i, { caption: e.target.value })} /></Field>
              </div>
              <button type="button" className="adm-link adm-link--danger" onClick={() => { if (window.confirm("Delete this before & after?")) set((x) => ({ ...x, gallery: x.gallery.filter((_, j) => j !== i) })); }}>Delete</button>
            </div>
          ))}
        </div>
        <button type="button" className="adm-btn adm-btn--ghost" onClick={() => set((x) => ({ ...x, gallery: [...x.gallery, { label: "New", caption: "" }] }))}>+ Add before & after</button>
      </Card>

      <Card title="Photo gallery" hint={`${photos.length} of ${PHOTO_LIMIT} photos. Big photos are made smaller automatically.`}>
        <div className="adm-photos">
          {photos.map((p, i) => (
            <div key={p + i} className="adm-photo">
              <img src={asset(p)} alt="" />
              <button type="button" className="adm-upload__remove" aria-label="Remove photo" onClick={() => set((x) => ({ ...x, photos: (x.photos || []).filter((_, j) => j !== i) }))}>×</button>
            </div>
          ))}
          {photos.length < PHOTO_LIMIT && (
            <div className="adm-upload">
              <span className="adm-upload__plus">+</span>
              <span className="adm-upload__label">{busy ? "Uploading…" : "Add photos"}</span>
              <input type="file" accept="image/*" multiple onChange={addPhotos} disabled={busy || !a.canEdit} aria-label="Add photos" />
            </div>
          )}
        </div>
      </Card>
    </fieldset>
  );
}

/* ============================== Business ============================== */

function BusinessPanel({ a }: { a: Admin }) {
  const d = a.draft;
  const set = a.update;
  const b = d.business;
  const c = d.contact;
  const setB = (patch: Partial<SiteConfig["business"]>) => set((x) => ({ ...x, business: { ...x.business, ...patch } }));
  const setC = (patch: Partial<SiteConfig["contact"]>) => set((x) => ({ ...x, contact: { ...x.contact, ...patch } }));
  const [town, setTown] = useState("");
  const week = d.hoursWeek || [];
  const setDay = (i: number, patch: Partial<(typeof week)[number]>) =>
    set((x) => ({ ...x, hoursWeek: (x.hoursWeek || []).map((h, j) => (j === i ? { ...h, ...patch } : h)) }));

  function addTown() {
    const t = town.trim();
    if (!t || b.serviceArea.includes(t)) return;
    setB({ serviceArea: [...b.serviceArea, t] });
    setTown("");
  }

  return (
    <fieldset className="adm-stack" disabled={!a.canEdit}>
      <Card title="Your business">
        <div className="adm-grid2">
          <Field label="Business name"><input value={b.name} onChange={(e) => setB({ name: e.target.value })} /></Field>
          <Field label="Short tagline"><input value={b.tagline} onChange={(e) => setB({ tagline: e.target.value })} placeholder="Mobile car detailing" /></Field>
          <Field label="Years of experience"><input inputMode="numeric" value={String(b.yearsExperience)} onChange={(e) => setB({ yearsExperience: Number(e.target.value.replace(/\D/g, "")) || 0 })} /></Field>
          <Field label="Type">
            <div className="adm-seg">
              <button type="button" className={d.mode === "mobile" ? "is-on" : ""} onClick={() => set((x) => ({ ...x, mode: "mobile" }))}>We come to you</button>
              <button type="button" className={d.mode === "studio" ? "is-on" : ""} onClick={() => set((x) => ({ ...x, mode: "studio" }))}>Customers come to us</button>
            </div>
          </Field>
        </div>
      </Card>

      <Card title="Contact">
        <div className="adm-grid2">
          <Field label="Phone"><input type="tel" value={c.phoneDisplay} onChange={(e) => setC({ phoneDisplay: e.target.value })} placeholder="(201) 555-0000" /></Field>
          <Field label="Email"><input type="email" value={c.email} onChange={(e) => setC({ email: e.target.value })} /></Field>
          <Field label="WhatsApp number (optional)"><input type="tel" value={c.whatsapp || ""} onChange={(e) => setC({ whatsapp: e.target.value.replace(/\D/g, "") })} placeholder="12015550000" /></Field>
          <Field label="Booking link (optional)"><input value={c.bookingUrl || ""} onChange={(e) => setC({ bookingUrl: e.target.value })} placeholder="Square, Calendly… Empty = our form" /></Field>
          <Field label="Instagram link"><input value={c.instagram || ""} onChange={(e) => setC({ instagram: e.target.value })} /></Field>
          <Field label="Facebook link"><input value={c.facebook || ""} onChange={(e) => setC({ facebook: e.target.value })} /></Field>
          <Field label="Google reviews link"><input value={c.googleReviewsUrl || ""} onChange={(e) => setC({ googleReviewsUrl: e.target.value })} /></Field>
        </div>
      </Card>

      <Card title={d.mode === "mobile" ? "Area you cover" : "Location"}>
        <div className="adm-grid2">
          <Field label="City"><input value={b.city} onChange={(e) => setB({ city: e.target.value })} /></Field>
          <Field label="State"><input value={b.state} maxLength={2} onChange={(e) => setB({ state: e.target.value.toUpperCase() })} /></Field>
          {d.mode === "studio" && <Field label="Address" wide><input value={b.address || ""} onChange={(e) => setB({ address: e.target.value })} /></Field>}
        </div>
        {d.mode === "mobile" && (
          <>
            <div className="adm-chips">
              {b.serviceArea.map((t) => (
                <span key={t} className="adm-chip is-on">{t} <button type="button" aria-label={`Remove ${t}`} onClick={() => setB({ serviceArea: b.serviceArea.filter((x) => x !== t) })}>×</button></span>
              ))}
            </div>
            <div className="adm-inline">
              <input className="adm-input" value={town} placeholder="Add a town" onChange={(e) => setTown(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTown(); } }} />
              <button type="button" className="adm-btn adm-btn--ghost" onClick={addTown}>Add</button>
            </div>
          </>
        )}
      </Card>

      <Card title="Google Maps" hint="Open Google Maps, find your business, press Share → Copy link, and paste it here.">
        <Field label="Google Maps link" wide>
          <input
            value={d.maps?.link || ""}
            placeholder="https://maps.app.goo.gl/…"
            onChange={(e) => set((x) => ({ ...x, maps: { link: e.target.value.trim() } }))}
          />
        </Field>
        <div className="adm-mapprev">
          <iframe title="Map preview" src={mapEmbedSrc(d)} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        </div>
        <p className="adm-muted adm-small">
          {d.maps?.link ? "The exact pin shows on your live website after Publish." : "No link yet — the map shows your city."}
        </p>
        <div className={`adm-toggle-row ${a.isPro ? "" : "is-locked"}`}>
          <div>
            <b>Show my Google reviews {!a.isPro && <span className="adm-pro">PRO</span>}</b>
            <p className="adm-muted adm-small">
              {a.isPro
                ? "Your real Google rating, review count and the newest reviews with photos. Updated every day."
                : "Your real Google rating and newest reviews with photos, updated every day. Available in the Pro plan — contact us to upgrade."}
            </p>
          </div>
          <Toggle label="Show Google reviews" on={a.isPro && Boolean(d.googleReviews)} onChange={(v) => a.isPro && set((x) => ({ ...x, googleReviews: v }))} />
        </div>
      </Card>

      <Card title="Opening hours">
        <div className="adm-hours">
          {week.map((h, i) => (
            <div key={h.day} className={`adm-hours__row ${h.open ? "" : "is-closed"}`}>
              <span className="adm-hours__day">{WEEK_DAYS[i] || h.day}</span>
              <Toggle label={`${h.day} open`} on={h.open} onChange={(v) => setDay(i, { open: v })} />
              {h.open ? (
                <span className="adm-inline">
                  <input type="time" value={h.from} aria-label={`${h.day} opens`} onChange={(e) => setDay(i, { from: e.target.value })} />
                  <span>–</span>
                  <input type="time" value={h.to} aria-label={`${h.day} closes`} onChange={(e) => setDay(i, { to: e.target.value })} />
                </span>
              ) : <span className="adm-muted">Closed</span>}
            </div>
          ))}
        </div>
      </Card>

      <Card title="Logo & color">
        <div className="adm-brandrow">
          <UploadBox a={a} url={b.logo} folder="logo" label="Logo" accept="image/png,image/jpeg,image/webp,image/svg+xml" onUrl={(u) => setB({ logo: u })} />
          <div>
            <p className="adm-small adm-muted">Brand color (buttons and highlights)</p>
            <div className="adm-swatches">
              {SWATCHES.map((s) => (
                <button key={s} type="button" className={`adm-swatch ${d.theme.accent.toLowerCase() === s.toLowerCase() ? "is-on" : ""}`} style={{ background: s }} aria-label={`Color ${s}`} onClick={() => set((x) => ({ ...x, theme: { ...x.theme, accent: s } }))} />
              ))}
            </div>
          </div>
        </div>
      </Card>
    </fieldset>
  );
}

/* ============================== Sections ============================== */

function SectionsPanel({ a }: { a: Admin }) {
  const list = resolveSections(a.draft);
  const save = (next: typeof list) => a.update((x) => ({ ...x, sections: next }));
  const move = (i: number, dir: -1 | 1) => {
    const next = [...list];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    save(next);
  };
  return (
    <fieldset className="adm-stack" disabled={!a.canEdit}>
      <Card title="Sections of your website" hint="Turn parts on or off and change their order. Top of the list = top of the page.">
        <ol className="adm-sections">
          {list.map((s, i) => (
            <li key={s.id} className={s.on ? "" : "is-off"}>
              <span className="adm-sections__num">{i + 1}</span>
              <span className="adm-sections__name">{SECTION_LABELS[s.id]}</span>
              <button type="button" className="adm-icon-btn" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
              <button type="button" className="adm-icon-btn" onClick={() => move(i, 1)} disabled={i === list.length - 1} aria-label="Move down">↓</button>
              <Toggle label={`Show ${SECTION_LABELS[s.id]}`} on={s.on} onChange={(on) => save(list.map((x) => (x.id === s.id ? { ...x, on } : x)))} />
            </li>
          ))}
        </ol>
      </Card>
    </fieldset>
  );
}
