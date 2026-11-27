import type { SiteConfig } from "@/site.config";

/** If someone pasted Google's "Embed a map" code, take the src out of it. */
function iframeSrc(text: string): string | null {
  const m = text.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i);
  if (m) return m[1].replace(/&amp;/g, "&");
  if (/^https:\/\/www\.google\.[^/]+\/maps\/embed/i.test(text.trim())) return text.trim();
  return null;
}

/** Reads the place name and coordinates out of a full Google Maps URL. */
export function parseMapsUrl(url: string): { name?: string; lat?: number; lng?: number } {
  const out: { name?: string; lat?: number; lng?: number } = {};
  const place = url.match(/\/maps\/place\/([^/@?]+)/);
  if (place) {
    try {
      out.name = decodeURIComponent(place[1].replace(/\+/g, " "));
    } catch {
      out.name = place[1].replace(/\+/g, " ");
    }
  }
  // Exact pin (!3d lat !4d lng) is better than the camera position (@lat,lng).
  const pin = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) || url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (pin) {
    out.lat = Number(pin[1]);
    out.lng = Number(pin[2]);
  }
  if (!out.name) {
    try {
      const q = new URL(url).searchParams.get("q") || new URL(url).searchParams.get("query");
      if (q) out.name = q;
    } catch {
      /* not a URL */
    }
  }
  return out;
}

/** Text that describes where the business is (used when the link has no details). */
export function placeQuery(site: SiteConfig): string {
  const b = site.business;
  const where = site.mode === "studio" && b.address ? b.address : `${b.city}, ${b.state}`;
  return `${b.name}, ${where}`;
}

/** The map shown on the website. Works without any Google key. */
export function mapEmbedSrc(site: SiteConfig): string {
  const raw = (site.maps?.link || "").trim();
  const fromCode = raw ? iframeSrc(raw) : null;
  if (fromCode) return fromCode;
  const info = parseMapsUrl(site.maps?.resolved || raw);
  let q: string;
  if (info.name) q = `${info.name}${info.lat != null ? "" : `, ${site.business.city}, ${site.business.state}`}`;
  else if (info.lat != null) q = `${info.lat},${info.lng}`;
  else q = site.mode === "mobile" ? `${site.business.city}, ${site.business.state}` : placeQuery(site);
  const ll = info.lat != null && info.name ? `&ll=${info.lat},${info.lng}` : "";
  return `https://www.google.com/maps?q=${encodeURIComponent(q)}${ll}&z=${site.mode === "mobile" && !info.name ? 11 : 15}&output=embed`;
}

/** Where the "Get directions" / "Open in Google Maps" button goes. */
export function mapsLink(site: SiteConfig): string {
  const raw = (site.maps?.link || "").trim();
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeQuery(site))}`;
}
