import type { Review, SiteConfig } from "@/site.config";
import { parseMapsUrl, placeQuery } from "./maps";

/**
 * Runs only while the website is being built (on Netlify), never in the visitor's browser.
 * GOOGLE_PLACES_API_KEY is a secret set in Netlify → Environment variables (no NEXT_PUBLIC_ prefix).
 */
const KEY = process.env.GOOGLE_PLACES_API_KEY || "";

/** maps.app.goo.gl/xxxx -> the full google.com/maps/place/... URL (follows the redirect). */
async function resolveShortLink(link: string): Promise<string | undefined> {
  if (!/^https:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps)\//i.test(link)) return undefined;
  try {
    const res = await fetch(link, { redirect: "follow", cache: "no-store" });
    return res.url && res.url !== link ? res.url : undefined;
  } catch {
    return undefined;
  }
}

type GPlace = {
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviews?: {
    rating?: number;
    relativePublishTimeDescription?: string;
    text?: { text?: string };
    originalText?: { text?: string };
    authorAttribution?: { displayName?: string; uri?: string; photoUri?: string };
  }[];
};

async function findPlace(site: SiteConfig): Promise<GPlace | null> {
  const info = parseMapsUrl(site.maps?.resolved || site.maps?.link || "");
  const body: Record<string, unknown> = {
    textQuery: info.name ? `${info.name}${info.lat == null ? `, ${site.business.city}, ${site.business.state}` : ""}` : placeQuery(site),
    languageCode: "en",
  };
  if (info.lat != null && info.lng != null) {
    body.locationBias = { circle: { center: { latitude: info.lat, longitude: info.lng }, radius: 500 } };
  }
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": KEY,
      "X-Goog-FieldMask": "places.rating,places.userRatingCount,places.reviews,places.googleMapsUri",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    console.warn(`[google] Places search failed ${res.status}: ${(await res.text()).slice(0, 300)}`);
    return null;
  }
  const data = (await res.json()) as { places?: GPlace[] };
  return data.places?.[0] ?? null;
}

/** Adds the full map link and (if turned on) the real Google rating and reviews. Never fails the build. */
export async function withGoogle(site: SiteConfig): Promise<SiteConfig> {
  let out = site;
  const link = site.maps?.link?.trim();
  if (link && !site.maps?.resolved) {
    const resolved = await resolveShortLink(link);
    if (resolved) out = { ...out, maps: { ...out.maps, resolved } };
  }
  if (!out.googleReviews) return out;
  if (!KEY) {
    console.warn("[google] googleReviews is on but GOOGLE_PLACES_API_KEY is not set — keeping saved reviews.");
    return out;
  }
  try {
    const place = await findPlace(out);
    if (!place) return out;
    const reviews: Review[] = (place.reviews || [])
      .filter((r) => (r.text?.text || r.originalText?.text) && (r.rating ?? 5) >= 4)
      .map((r) => ({
        name: r.authorAttribution?.displayName || "Google user",
        text: (r.text?.text || r.originalText?.text || "").trim(),
        service: "Google review",
        when: r.relativePublishTimeDescription || "",
        rating: r.rating,
        photo: r.authorAttribution?.photoUri,
        url: r.authorAttribution?.uri,
      }));
    return {
      ...out,
      rating:
        place.rating && place.userRatingCount
          ? { score: Math.round(place.rating * 10) / 10, count: place.userRatingCount, fromGoogle: true }
          : out.rating,
      reviews: reviews.length ? reviews : out.reviews,
      contact: { ...out.contact, googleReviewsUrl: out.contact.googleReviewsUrl || place.googleMapsUri },
    };
  } catch (err) {
    console.warn("[google] Could not load reviews:", err);
    return out;
  }
}
