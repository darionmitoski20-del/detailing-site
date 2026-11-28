"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { offer } from "@/offer.config";
import type { Admin, BookingStatus, SiteRow } from "./useAdmin";
import { trialDaysLeft } from "./ClientsPanel";

type B = { id: string; site_id: string; created_at: string; status: BookingStatus; estimate: number | null; name: string; service: string | null };
type Pub = { site_id: string; published_at: string };

const DAY = 864e5;
const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const PLAN_LABEL: Record<SiteRow["plan"], string> = { basic: "Basic", admin: "Admin", pro: "Pro" };

function monthlyFor(plan: SiteRow["plan"]): number | null {
  const p = offer.packages.find((x) => x.id === plan);
  return p ? p.monthly : null;
}

function ago(iso: string) {
  const h = (Date.now() - new Date(iso).getTime()) / 36e5;
  if (h < 1) return "just now";
  if (h < 24) return `${Math.round(h)} h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "yesterday" : `${d} days ago`;
}

/** Your main dashboard: how the whole business is doing, across all clients. */
export default function OverviewPanel({ a, onOpen, onClients }: { a: Admin; onOpen: (id: string) => void; onClients: () => void }) {
  const supabase = getSupabase();
  const [bookings, setBookings] = useState<B[]>([]);
  const [pubs, setPubs] = useState<Pub[]>([]);
  const [requests, setRequests] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    if (!supabase) return;
    const since = new Date(Date.now() - 90 * DAY).toISOString();
    const [b, p, r] = await Promise.all([
      supabase.from("bookings").select("id, site_id, created_at, status, estimate, name, service").gte("created_at", since).order("created_at", { ascending: false }).limit(2000),
      supabase.from("published_sites").select("site_id, published_at"),
      supabase.from("access_requests").select("id", { count: "exact", head: true }),
    ]);
    if (b.data) setBookings(b.data as B[]);
    if (p.data) setPubs(p.data as Pub[]);
    setRequests(r.count || 0);
    setLoaded(true);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const onTrial = (s: SiteRow) => (trialDaysLeft(s) ?? 0) > 0;
    const active = a.sites.filter((s) => s.active && !onTrial(s));
    const trials = a.sites.filter((s) => s.active && onTrial(s));
    const paused = a.sites.filter((s) => !s.active);
    let income = 0;
    let unpriced = 0;
    for (const s of active) {
      const m = monthlyFor(s.plan);
      if (m == null) unpriced++;
      else income += m;
    }
    const last30 = bookings.filter((b) => Date.now() - new Date(b.created_at).getTime() < 30 * DAY);
    const prev30 = bookings.filter((b) => {
      const age = Date.now() - new Date(b.created_at).getTime();
      return age >= 30 * DAY && age < 60 * DAY;
    });
    return {
      active: active.length,
      trials: trials.length,
      paused: paused.length,
      income,
      unpriced,
      req30: last30.length,
      reqPrev: prev30.length,
      value30: last30.reduce((t, b) => t + (b.estimate || 0), 0),
      waiting: bookings.filter((b) => b.status === "new").length,
      byPlan: (["basic", "admin", "pro"] as const).map((p) => ({ plan: p, n: a.sites.filter((s) => s.plan === p).length })),
    };
  }, [a.sites, bookings]);

  const rows = a.sites.map((s) => {
    const mine = bookings.filter((b) => b.site_id === s.id);
    const pub = pubs.find((p) => p.site_id === s.id);
    const todo: string[] = [];
    if (!pub) todo.push("Not published yet");
    if (!s.build_hook) todo.push("No Netlify build hook");
    const o = s.onboarding;
    if (o && !s.build_hook) todo.unshift(o.hasDomain ? `Connect ${o.domain}` : `Buy domain (${o.domainIdeas?.[0] || "ask"})`);
    if (!o && !s.draft) todo.unshift("Wizard not finished");
    return {
      s,
      req30: mine.filter((b) => Date.now() - new Date(b.created_at).getTime() < 30 * DAY).length,
      waiting: mine.filter((b) => b.status === "new").length,
      last: mine[0]?.created_at,
      pub,
      todo,
    };
  });
  const siteName = (id: string) => a.sites.find((s) => s.id === id)?.name || "—";
  const trend = stats.req30 - stats.reqPrev;

  return (
    <div className="adm-stack">
      <div className="adm-kpis">
        <div className="adm-kpi">
          <span>Monthly income</span>
          <b>{money(stats.income)}</b>
          <small>{stats.active} paying client{stats.active === 1 ? "" : "s"}{stats.trials ? ` · ${stats.trials} on free trial` : ""}{stats.unpriced ? ` · ${stats.unpriced} Pro without a price` : ""}</small>
        </div>
        <div className="adm-kpi">
          <span>Clients</span>
          <b>{a.sites.length}</b>
          <small>{stats.byPlan.filter((x) => x.n).map((x) => `${x.n} ${PLAN_LABEL[x.plan]}`).join(" · ") || "none yet"}</small>
        </div>
        <div className={`adm-kpi ${stats.paused ? "adm-kpi--bad" : ""}`}>
          <span>Not paid</span>
          <b>{stats.paused}</b>
          <small>{stats.paused ? "Admin locked for these clients" : "Everyone is paid"}</small>
        </div>
        <div className="adm-kpi">
          <span>Booking requests · 30 days</span>
          <b>{stats.req30}</b>
          <small>
            {loaded && (trend === 0 ? "same as month before" : `${trend > 0 ? "▲" : "▼"} ${Math.abs(trend)} vs month before`)}
            {stats.value30 ? ` · ${money(stats.value30)} estimated` : ""}
          </small>
        </div>
      </div>

      {(requests > 0 || stats.waiting > 0) && (
        <div className="adm-alerts">
          {requests > 0 && (
            <button className="adm-alert" onClick={onClients}>
              <b>{requests}</b> new detailer{requests === 1 ? "" : "s"} asked for access → approve in Clients
            </button>
          )}
          {stats.waiting > 0 && (
            <div className="adm-alert adm-alert--soft">
              <b>{stats.waiting}</b> booking request{stats.waiting === 1 ? "" : "s"} still marked “New” by your clients
            </div>
          )}
        </div>
      )}

      <section className="adm-card">
        <div className="adm-card__head">
          <div><h3>Your clients</h3><p className="adm-muted adm-small">Plan, payment and how their website is doing.</p></div>
          <button className="adm-btn adm-btn--ghost" onClick={onClients}>+ Add client</button>
        </div>
        {rows.length === 0 ? (
          <div className="adm-empty">No clients yet. Press “Add client” to set up your first one.</div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr><th>Client</th><th>Plan</th><th>Payment</th><th>Requests 30d</th><th>Last request</th><th>Setup</th><th /></tr>
              </thead>
              <tbody>
                {rows.map(({ s, req30, waiting, last, todo }) => (
                  <tr key={s.id}>
                    <td data-label="Client"><b>{s.name}</b></td>
                    <td data-label="Plan">{PLAN_LABEL[s.plan]}{monthlyFor(s.plan) != null ? ` · ${money(monthlyFor(s.plan)!)}/mo` : ""}</td>
                    <td data-label="Payment">{!s.active ? <span className="adm-status adm-status--new">Not paid</span> : (trialDaysLeft(s) ?? 0) > 0 ? <span className="adm-status adm-status--trial">Trial · {trialDaysLeft(s)}d</span> : <span className="adm-status adm-status--confirmed">Paid</span>}</td>
                    <td data-label="Requests 30d">{req30}{waiting ? <span className="adm-muted"> · {waiting} new</span> : ""}</td>
                    <td data-label="Last request">{last ? ago(last) : <span className="adm-muted">none yet</span>}</td>
                    <td data-label="Setup">{todo.length ? <span className="adm-warn">{todo.join(", ")}</span> : <span className="adm-ok">✓ Live</span>}</td>
                    <td><button className="adm-btn adm-btn--ghost" onClick={() => onOpen(s.id)}>Open</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="adm-card">
        <div className="adm-card__head"><div><h3>Latest booking requests</h3><p className="adm-muted adm-small">From all your clients’ websites.</p></div></div>
        {bookings.length === 0 ? (
          <div className="adm-empty">{loaded ? "No booking requests yet." : "Loading…"}</div>
        ) : (
          <div className="adm-feed">
            {bookings.slice(0, 10).map((b) => (
              <div key={b.id} className="adm-feed__row">
                <span className={`adm-dot adm-dot--${b.status}`} />
                <span><b>{siteName(b.site_id)}</b> · {b.name}{b.service ? ` · ${b.service}` : ""}{b.estimate ? ` · ${money(b.estimate)}` : ""}</span>
                <span className="adm-muted adm-small">{ago(b.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
