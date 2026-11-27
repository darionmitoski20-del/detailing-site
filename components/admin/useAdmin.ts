"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { site as demoSite, type SiteConfig } from "@/site.config";
import { hasBackend, SITE_ID, withDefaults } from "@/lib/siteData";
import { getSupabase, shrinkImage, videoDuration } from "@/lib/supabase";
import { DEFAULT_WEEK, groupHours } from "@/lib/hours";

export type BookingStatus = "new" | "confirmed" | "done";
export type BookingRow = {
  id: string;
  created_at: string;
  name: string;
  phone: string;
  email: string | null;
  vehicle: string | null;
  service: string | null;
  estimate: number | null;
  preferred_date: string | null;
  details: string | null;
  status: BookingStatus;
};
export type SiteRow = { id: string; slug: string; name: string; plan: "basic" | "admin" | "pro"; active: boolean; build_hook: string | null; draft: Partial<SiteConfig> | null };

export type Phase = "loading" | "signedOut" | "pending" | "ready";

export const PHOTO_LIMIT = 50;
export const VIDEO_MAX_SECONDS = 30;
export const VIDEO_MAX_MB = 25;
const PREVIEW_KEY = "detailer-admin-preview";

/** Makes sure the draft has everything the admin edits (hours per day, etc.). */
function prepareDraft(d: SiteConfig): SiteConfig {
  return { ...d, hoursWeek: d.hoursWeek && d.hoursWeek.length === 7 ? d.hoursWeek : DEFAULT_WEEK, photos: d.photos || [] };
}

/** What gets saved: also rebuilds the hours text shown on the website. */
function finalizeDraft(d: SiteConfig): SiteConfig {
  const name = d.business.name.trim();
  return {
    ...d,
    business: {
      ...d.business,
      initial: (name.charAt(0) || "D").toUpperCase(),
      hours: d.hoursWeek ? groupHours(d.hoursWeek) : d.business.hours,
    },
    contact: { ...d.contact, phone: digitsWithCountry(d.contact.phoneDisplay) || d.contact.phone },
  };
}

/** "(201) 555-0000" -> "12015550000" */
export function digitsWithCountry(display: string): string {
  const digits = (display || "").replace(/\D/g, "");
  if (digits.length === 10) return `1${digits}`;
  return digits;
}

const SAMPLE_BOOKINGS: BookingRow[] = [
  { id: "d1", created_at: new Date(Date.now() - 2 * 3600e3).toISOString(), name: "Mike R.", phone: "(201) 555-0142", email: null, vehicle: "SUV / Crossover", service: "Full Detail", estimate: 490, preferred_date: "Saturday morning", details: "Dog hair in the back seats", status: "new" },
  { id: "d2", created_at: new Date(Date.now() - 26 * 3600e3).toISOString(), name: "Jessica T.", phone: "(973) 555-0188", email: null, vehicle: "Sedan / Coupe", service: "Interior Detail", estimate: 285, preferred_date: "Any day next week", details: "Coffee stain on the passenger seat", status: "new" },
  { id: "d3", created_at: new Date(Date.now() - 50 * 3600e3).toISOString(), name: "Carlos M.", phone: "(551) 555-0107", email: null, vehicle: "Truck / Van", service: "Exterior Detail", estimate: 249, preferred_date: "Tuesday 10 AM", details: "Work truck, very muddy", status: "confirmed" },
];

export function useAdmin(forceDemo = false) {
  const demo = forceDemo || !hasBackend;
  const supabase = demo ? null : getSupabase();

  const [phase, setPhase] = useState<Phase>(demo ? "ready" : "loading");
  const [session, setSession] = useState<Session | null>(null);
  const [sites, setSites] = useState<SiteRow[]>([]);
  const [platformAdmin, setPlatformAdmin] = useState(false);
  const [siteId, setSiteId] = useState<string | null>(demo ? "demo" : null);
  const [draft, setDraft] = useState<SiteConfig>(() => prepareDraft(demoSite));
  const [publishedJson, setPublishedJson] = useState<string>(() => JSON.stringify(finalizeDraft(prepareDraft(demoSite))));
  const [bookings, setBookings] = useState<BookingRow[]>(demo ? SAMPLE_BOOKINGS : []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedSite = useRef<string | null>(null);

  const site = sites.find((s) => s.id === siteId) || null;
  // The platform admin (you) can edit every site, on any plan.
  const canEdit = demo || Boolean(site && (platformAdmin || (site.plan !== "basic" && site.active)));
  const locked = Boolean(site && !site.active);
  const plan: SiteRow["plan"] = demo ? "admin" : site?.plan ?? "basic";
  const isPro = plan === "pro";

  const flash = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  }, []);

  // ---- Session ----
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setPhase("signedOut");
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (!s) {
        setPhase("signedOut");
        setSites([]);
        setSiteId(null);
        loadedSite.current = null;
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  // ---- Which sites can this person open ----
  const loadSites = useCallback(async () => {
    if (!supabase) return;
    // Only the platform admin can read this table, so any row = it's you.
    const { data: pa } = await supabase.from("platform_admins").select("email").limit(1);
    const isPA = Boolean(pa && pa.length);
    setPlatformAdmin(isPA);
    const { data, error: err } = await supabase
      .from("sites")
      .select("id, slug, name, plan, active, build_hook, draft")
      .order("name");
    if (err) {
      setError(err.message);
      setPhase("pending");
      return;
    }
    const rows = (data || []) as SiteRow[];
    setSites(rows);
    if (rows.length === 0) {
      setSiteId(null);
      // You (platform admin) still get in, to add your first client.
      setPhase(isPA ? "ready" : "pending");
      return;
    }
    const preferred = rows.find((r) => r.id === SITE_ID) || rows[0];
    setSiteId((cur) => (cur && rows.some((r) => r.id === cur) ? cur : preferred.id));
    setPhase("ready");
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !session) return;
    setPhase("loading");
    loadSites();
  }, [supabase, session, loadSites]);

  // ---- Load the chosen site's draft, published version and bookings ----
  useEffect(() => {
    if (!supabase || !siteId || loadedSite.current === siteId) return;
    const row = sites.find((s) => s.id === siteId);
    if (!row) return;
    loadedSite.current = siteId;
    (async () => {
      const { data: pub } = await supabase.from("published_sites").select("data").eq("site_id", siteId).maybeSingle();
      const published = pub?.data ? withDefaults(pub.data as Partial<SiteConfig>) : null;
      const base = row.draft ? withDefaults(row.draft) : published || withDefaults({ ...demoSite, business: { ...demoSite.business, name: row.name }, reviews: [], rating: { score: 5, count: 0 } });
      setDraft(prepareDraft(base));
      setPublishedJson(published ? JSON.stringify(published) : "");
      await refreshBookings(siteId);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, siteId, sites]);

  const refreshBookings = useCallback(
    async (id = siteId) => {
      if (!supabase || !id) return;
      const { data, error: err } = await supabase
        .from("bookings")
        .select("*")
        .eq("site_id", id)
        .order("created_at", { ascending: false })
        .limit(200);
      if (err) setError(err.message);
      else setBookings((data || []) as BookingRow[]);
    },
    [supabase, siteId],
  );

  // ---- Editing ----
  const finalDraft = useMemo(() => {
    const f = finalizeDraft(draft);
    // Google reviews are a Pro plan feature.
    return !isPro && f.googleReviews ? { ...f, googleReviews: false } : f;
  }, [draft, isPro]);
  const dirty = JSON.stringify(finalDraft) !== publishedJson;

  const update = useCallback(
    (fn: (d: SiteConfig) => SiteConfig) => {
      if (!canEdit) return;
      setDraft((d) => {
        const next = fn(d);
        if (supabase && siteId) {
          if (saveTimer.current) clearTimeout(saveTimer.current);
          saveTimer.current = setTimeout(async () => {
            setSaving(true);
            const { error: err } = await supabase.from("sites").update({ draft: finalizeDraft(next) }).eq("id", siteId);
            setSaving(false);
            if (err) setError(`Could not save: ${err.message}`);
          }, 800);
        }
        return next;
      });
    },
    [canEdit, supabase, siteId],
  );

  const publish = useCallback(async () => {
    if (!dirty) {
      flash("Nothing new to publish.");
      return;
    }
    if (demo || !supabase || !siteId) {
      setPublishedJson(JSON.stringify(finalDraft));
      flash("Published (demo — nothing is saved).");
      return;
    }
    const data = finalDraft;
    const { error: err } = await supabase
      .from("published_sites")
      .upsert({ site_id: siteId, data, published_at: new Date().toISOString() });
    if (err) {
      setError(`Could not publish: ${err.message}`);
      return;
    }
    await supabase.from("sites").update({ draft: data }).eq("id", siteId);
    setPublishedJson(JSON.stringify(data));
    if (site?.build_hook) {
      try {
        await fetch(site.build_hook, { method: "POST", mode: "no-cors" });
      } catch {
        /* the rebuild request is fire-and-forget */
      }
      flash("Published. Your website updates in about 2 minutes.");
    } else {
      flash("Published.");
    }
  }, [dirty, demo, supabase, siteId, finalDraft, site, flash]);

  const openPreview = useCallback(() => {
    try {
      localStorage.setItem(PREVIEW_KEY, JSON.stringify(finalDraft));
    } catch {
      /* storage blocked: preview falls back to the template */
    }
    const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
    window.open(`${base}/preview/`, "_blank", "noopener");
  }, [finalDraft]);

  const setBookingStatus = useCallback(
    async (id: string, status: BookingStatus) => {
      setBookings((list) => list.map((b) => (b.id === id ? { ...b, status } : b)));
      if (supabase) {
        const { error: err } = await supabase.from("bookings").update({ status }).eq("id", id);
        if (err) setError(err.message);
      }
    },
    [supabase],
  );

  /** Uploads a photo or video into this site's folder and returns its public URL. */
  const upload = useCallback(
    async (file: File, folder: string): Promise<string | null> => {
      setError(null);
      const isVideo = file.type.startsWith("video/");
      if (isVideo) {
        if (file.size > VIDEO_MAX_MB * 1024 * 1024) {
          setError(`The video is too big. Max ${VIDEO_MAX_MB} MB.`);
          return null;
        }
        const secs = await videoDuration(file);
        if (secs > VIDEO_MAX_SECONDS + 1) {
          setError(`The video is ${Math.round(secs)} seconds. Max ${VIDEO_MAX_SECONDS} seconds.`);
          return null;
        }
      }
      const body = isVideo ? file : await shrinkImage(file);
      if (demo || !supabase || !siteId) return URL.createObjectURL(body);
      const ext = isVideo ? (file.name.split(".").pop() || "mp4").toLowerCase() : body.type === "image/jpeg" ? "jpg" : (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${siteId}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: err } = await supabase.storage
        .from("site-media")
        .upload(path, body, { contentType: isVideo ? file.type : body.type || file.type, upsert: false });
      if (err) {
        setError(`Upload failed: ${err.message}`);
        return null;
      }
      return supabase.storage.from("site-media").getPublicUrl(path).data.publicUrl;
    },
    [demo, supabase, siteId],
  );

  const signIn = useCallback(
    async (email: string) => {
      if (!supabase) return { ok: false, message: "Demo mode: sign-in is not connected." };
      const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
      const { error: err } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}${base}/admin/`, shouldCreateUser: true },
      });
      return err ? { ok: false, message: err.message } : { ok: true, message: "" };
    },
    [supabase],
  );

  /** Password login (optional — mainly for you, so you don't depend on email links). */
  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      if (!supabase) return { ok: false, message: "Demo mode: sign-in is not connected." };
      const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      return err ? { ok: false, message: err.message === "Invalid login credentials" ? "Wrong email or password." : err.message } : { ok: true, message: "" };
    },
    [supabase],
  );

  const requestAccess = useCallback(
    async (payload: { email: string; business: string; phone: string }) => {
      if (!supabase) return { ok: true };
      const { error: err } = await supabase.from("access_requests").insert(payload);
      return { ok: !err, message: err?.message };
    },
    [supabase],
  );

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
  }, [supabase]);

  return {
    demo, phase, session, sites, site, siteId, setSiteId: (id: string) => { loadedSite.current = null; setSiteId(id); },
    draft, update, dirty, saving, publish, openPreview,
    bookings, setBookingStatus, refreshBookings,
    upload, signIn, signInWithPassword, signOut, requestAccess,
    canEdit, locked, plan, isPro, platformAdmin, loadSites, flash,
    error, setError, toast,
  };
}

export type Admin = ReturnType<typeof useAdmin>;
export { PREVIEW_KEY };
