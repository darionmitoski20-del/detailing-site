// Supabase Edge Function: emails the detailer (and the customer) when a new booking comes in.
// Called by a Database Webhook on INSERT into public.bookings.
//
// Secrets to set (Supabase → Edge Functions → Secrets). Never put them in code:
//   RESEND_API_KEY   – from resend.com
//   FROM_EMAIL       – e.g. "Bookings <bookings@yourdomain.com>" (domain verified in Resend)
//   WEBHOOK_SECRET   – any long random text; the same value goes in the webhook header "x-webhook-secret"
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase automatically.

import { createClient } from "jsr:@supabase/supabase-js@2";

type Booking = {
  id: string;
  site_id: string;
  name: string;
  phone: string;
  email: string | null;
  vehicle: string | null;
  service: string | null;
  estimate: number | null;
  preferred_date: string | null;
  details: string | null;
};

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

async function sendEmail(to: string[], subject: string, html: string, replyTo?: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: Deno.env.get("FROM_EMAIL"), to, subject, html, reply_to: replyTo }),
  });
  if (!res.ok) console.error("Resend error", res.status, await res.text());
}

Deno.serve(async (req) => {
  const secret = Deno.env.get("WEBHOOK_SECRET");
  if (!secret || req.headers.get("x-webhook-secret") !== secret) return new Response("Forbidden", { status: 403 });

  const payload = await req.json().catch(() => null);
  const b: Booking | undefined = payload?.record;
  if (payload?.type !== "INSERT" || !b?.site_id) return new Response("Ignored", { status: 200 });

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const [{ data: pub }, { data: members }, { data: siteRow }] = await Promise.all([
    db.from("published_sites").select("data").eq("site_id", b.site_id).maybeSingle(),
    db.from("site_members").select("email").eq("site_id", b.site_id),
    db.from("sites").select("name, slug").eq("id", b.site_id).maybeSingle(),
  ]);

  const site = (pub?.data ?? {}) as { business?: { name?: string; url?: string }; contact?: { email?: string; phoneDisplay?: string } };
  const businessName = site.business?.name || siteRow?.name || "your business";
  const detailerEmails = Array.from(
    new Set([site.contact?.email, ...(members ?? []).map((m: { email: string }) => m.email)].filter((e): e is string => Boolean(e) && !String(e).endsWith("@example.com"))),
  );

  const rows: [string, unknown][] = [
    ["Name", b.name], ["Phone", b.phone], ["Email", b.email], ["Service", b.service], ["Vehicle", b.vehicle],
    ["Estimate", b.estimate != null ? `$${b.estimate}` : null], ["When", b.preferred_date], ["Notes", b.details],
  ];
  const table = rows
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><td style="padding:6px 12px 6px 0;color:#6b6b73;font-weight:700">${k}</td><td style="padding:6px 0">${esc(v)}</td></tr>`)
    .join("");
  const tel = String(b.phone).replace(/[^\d+]/g, "");

  if (detailerEmails.length) {
    await sendEmail(
      detailerEmails,
      `New booking request: ${b.name} – ${b.service || "detail"}`,
      `<div style="font-family:Arial,sans-serif;font-size:15px;color:#0b0b0c">
        <h2 style="margin:0 0 12px">New booking request</h2>
        <table>${table}</table>
        <p style="margin:20px 0"><a href="tel:${esc(tel)}" style="background:#E11D2E;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700">Call ${esc(b.phone)}</a></p>
        <p style="color:#6b6b73;font-size:13px">See all requests in your admin${site.business?.url ? `: ${esc(site.business.url)}/admin` : ""}.</p>
      </div>`,
      b.email || undefined,
    );
  }

  if (b.email) {
    await sendEmail(
      [b.email],
      `We got your request – ${businessName}`,
      `<div style="font-family:Arial,sans-serif;font-size:15px;color:#0b0b0c">
        <h2 style="margin:0 0 12px">Thanks, ${esc(b.name.split(" ")[0])}!</h2>
        <p>We got your booking request and will contact you soon to confirm the time.</p>
        <table>${table}</table>
        ${site.contact?.phoneDisplay ? `<p>Questions? Call or text us at <b>${esc(site.contact.phoneDisplay)}</b>.</p>` : ""}
        <p>— ${esc(businessName)}</p>
      </div>`,
      detailerEmails[0],
    );
  }

  return new Response("OK", { status: 200 });
});
