"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { getSupabase } from "@/lib/supabase";
import type { Admin, SiteRow } from "./useAdmin";

type Member = { site_id: string; email: string; role: string };
type AccessRequest = { id: string; created_at: string; email: string; business: string; phone: string | null };
const PLANS: { id: SiteRow["plan"]; label: string }[] = [
  { id: "basic", label: "Basic — requests only" },
  { id: "admin", label: "Admin — edits the site" },
  { id: "pro", label: "Pro — admin + Google reviews" },
];

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "site";
}

/** Only for you (platform admin): add clients, change plan, pause, approve access requests. */
export default function ClientsPanel({ a, onOpen }: { a: Admin; onOpen: (siteId: string) => void }) {
  const supabase = getSupabase();
  const [members, setMembers] = useState<Member[]>([]);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState<SiteRow["plan"]>("admin");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<{ name: string; id: string } | null>(null);

  const load = useCallback(async () => {
    if (!supabase) return;
    const [m, r] = await Promise.all([
      supabase.from("site_members").select("site_id, email, role"),
      supabase.from("access_requests").select("*").order("created_at", { ascending: false }),
    ]);
    if (m.data) setMembers(m.data as Member[]);
    if (r.data) setRequests(r.data as AccessRequest[]);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  async function createClient(e: FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    a.setError(null);
    const base = slugify(name);
    const slug = a.sites.some((s) => s.slug === base) ? `${base}-${Math.random().toString(36).slice(2, 6)}` : base;
    const { data, error } = await supabase.from("sites").insert({ slug, name: name.trim(), plan }).select("id").single();
    if (error || !data) {
      setBusy(false);
      a.setError(`Could not add client: ${error?.message}`);
      return;
    }
    const { error: mErr } = await supabase.from("site_members").insert({ site_id: data.id, email: email.trim().toLowerCase(), role: "owner" });
    setBusy(false);
    if (mErr) a.setError(`Client added, but the email failed: ${mErr.message}`);
    const req = requests.find((r) => r.email.toLowerCase() === email.trim().toLowerCase());
    if (req) await supabase.from("access_requests").delete().eq("id", req.id);
    setCreated({ name: name.trim(), id: data.id });
    setName("");
    setEmail("");
    await Promise.all([a.loadSites(), load()]);
  }

  async function updateSite(id: string, patch: Partial<Pick<SiteRow, "plan" | "active" | "build_hook">>) {
    if (!supabase) return;
    const { error } = await supabase.from("sites").update(patch).eq("id", id);
    if (error) a.setError(error.message);
    else {
      a.flash("Saved.");
      await a.loadSites();
    }
  }

  async function addMember(siteId: string) {
    const e = window.prompt("Email of the person who can log in to this site:");
    if (!e || !supabase) return;
    const { error } = await supabase.from("site_members").insert({ site_id: siteId, email: e.trim().toLowerCase(), role: "staff" });
    if (error) a.setError(error.message);
    await load();
  }

  async function removeMember(siteId: string, e: string) {
    if (!supabase || !window.confirm(`Remove ${e} from this site?`)) return;
    await supabase.from("site_members").delete().eq("site_id", siteId).eq("email", e);
    await load();
  }

  async function deleteRequest(id: string) {
    if (!supabase || !window.confirm("Delete this request?")) return;
    await supabase.from("access_requests").delete().eq("id", id);
    await load();
  }

  return (
    <div className="adm-stack">
      <section className="adm-card">
        <div className="adm-card__head">
          <div>
            <h3>Add a client</h3>
            <p className="adm-muted adm-small">The email is what the detailer uses to log in to their admin.</p>
          </div>
        </div>
        <form onSubmit={createClient}>
          <div className="adm-grid2">
            <label className="adm-field"><span>Business name</span><input required value={name} onChange={(e) => setName(e.target.value)} placeholder="JustMac Detailing" /></label>
            <label className="adm-field"><span>Owner email</span><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="owner@business.com" /></label>
            <label className="adm-field"><span>Plan</span>
              <select value={plan} onChange={(e) => setPlan(e.target.value as SiteRow["plan"])}>
                {PLANS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </label>
          </div>
          <button className="adm-btn adm-btn--primary" disabled={busy}>{busy ? "Adding…" : "Add client"}</button>
        </form>
        {created && (
          <div className="adm-banner adm-banner--ok">
            <b>{created.name}</b> added. Site ID for Netlify (NEXT_PUBLIC_SITE_ID): <code className="adm-code">{created.id}</code>
          </div>
        )}
      </section>

      {requests.length > 0 && (
        <section className="adm-card">
          <div className="adm-card__head"><div><h3>Access requests</h3><p className="adm-muted adm-small">Detailers who pressed “Request access”.</p></div></div>
          <div className="adm-list">
            {requests.map((r) => (
              <div key={r.id} className="adm-client">
                <div>
                  <b>{r.business}</b>
                  <div className="adm-muted adm-small">{r.email}{r.phone ? ` · ${r.phone}` : ""} · {new Date(r.created_at).toLocaleDateString()}</div>
                </div>
                <div className="adm-inline">
                  <button className="adm-btn adm-btn--ghost" onClick={() => { setName(r.business); setEmail(r.email); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Approve</button>
                  <button className="adm-icon-btn adm-icon-btn--danger" aria-label="Delete request" onClick={() => deleteRequest(r.id)}>×</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="adm-card">
        <div className="adm-card__head"><div><h3>Clients ({a.sites.length})</h3></div></div>
        {a.sites.length === 0 ? (
          <div className="adm-empty">No clients yet. Add your first one above.</div>
        ) : (
          <div className="adm-list">
            {a.sites.map((s) => {
              const people = members.filter((m) => m.site_id === s.id);
              return (
                <article key={s.id} className={`adm-client-card ${s.active ? "" : "is-paused"}`}>
                  <div className="adm-client">
                    <div>
                      <h3>{s.name}</h3>
                      <div className="adm-muted adm-small">ID: <code className="adm-code">{s.id}</code></div>
                    </div>
                    <button className="adm-btn adm-btn--primary" onClick={() => onOpen(s.id)}>Open</button>
                  </div>
                  <div className="adm-grid2">
                    <label className="adm-field"><span>Plan</span>
                      <select value={s.plan} onChange={(e) => updateSite(s.id, { plan: e.target.value as SiteRow["plan"] })}>
                        {PLANS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                      </select>
                    </label>
                    <label className="adm-field"><span>Payment status</span>
                      <select value={s.active ? "on" : "off"} onChange={(e) => updateSite(s.id, { active: e.target.value === "on" })}>
                        <option value="on">Paid — admin unlocked</option>
                        <option value="off">Not paid — admin locked</option>
                      </select>
                    </label>
                    <label className="adm-field adm-field--wide"><span>Netlify build hook (Publish updates the site)</span>
                      <input defaultValue={s.build_hook || ""} placeholder="https://api.netlify.com/build_hooks/…"
                        onBlur={(e) => { const v = e.target.value.trim() || null; if (v !== (s.build_hook || null)) updateSite(s.id, { build_hook: v }); }} />
                    </label>
                  </div>
                  <div className="adm-chips">
                    {people.map((m) => (
                      <span key={m.email} className="adm-chip">{m.email} <button aria-label={`Remove ${m.email}`} onClick={() => removeMember(s.id, m.email)}>×</button></span>
                    ))}
                    <button className="adm-chip" onClick={() => addMember(s.id)}>+ Add login email</button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
