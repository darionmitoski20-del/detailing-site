import { site as demoSite, type SiteConfig } from "@/site.config";
import { withGoogle } from "./google";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
/** Which client site this deployment shows. Empty = the demo from site.config.ts. */
export const SITE_ID = process.env.NEXT_PUBLIC_SITE_ID || "";

export const hasBackend = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
export const isClientSite = Boolean(hasBackend && SITE_ID);

/** Fill anything missing in saved data with the template values, so the page never breaks. */
export function withDefaults(data: Partial<SiteConfig> | null | undefined): SiteConfig {
  const d = (data || {}) as Partial<SiteConfig>;
  return {
    ...demoSite,
    ...d,
    business: { ...demoSite.business, ...(d.business || {}) },
    contact: { ...demoSite.contact, ...(d.contact || {}) },
    theme: { ...demoSite.theme, ...(d.theme || {}) },
    hero: { ...demoSite.hero, ...(d.hero || {}) },
    rating: { ...demoSite.rating, ...(d.rating || {}) },
    calculator: { ...demoSite.calculator, ...(d.calculator || {}) },
  };
}

/**
 * Loads the published website data at build time.
 * A client site (SITE_ID set) reads it from Supabase; the demo uses site.config.ts.
 */
export async function getSiteData(): Promise<SiteConfig> {
  if (!isClientSite) return demoSite;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/published_sites?site_id=eq.${encodeURIComponent(SITE_ID)}&select=data`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }, cache: "no-store" },
    );
    if (!res.ok) throw new Error(`Supabase ${res.status}`);
    const rows = (await res.json()) as { data: Partial<SiteConfig> }[];
    if (!rows[0]) {
      console.warn(`[siteData] Site ${SITE_ID} has nothing published yet — showing the template.`);
      return demoSite;
    }
    return await withGoogle(withDefaults(rows[0].data));
  } catch (err) {
    console.error("[siteData] Could not load site from Supabase:", err);
    throw err; // fail the build rather than publish a wrong site
  }
}
