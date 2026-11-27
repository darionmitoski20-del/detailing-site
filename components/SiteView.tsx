import type { CSSProperties, ReactNode } from "react";
import { DEFAULT_SECTIONS, type SectionId, type SiteConfig } from "@/site.config";
import { accentVars } from "@/lib/color";
import Header from "./Header";
import Hero from "./Hero";
import TrustBadges from "./TrustBadges";
import Services from "./Services";
import PriceCalculator from "./PriceCalculator";
import BeforeAfter from "./BeforeAfter";
import Photos from "./Photos";
import HowItWorks from "./HowItWorks";
import Reviews from "./Reviews";
import Faq from "./Faq";
import MapSection from "./MapSection";
import Booking from "./Booking";
import Footer from "./Footer";
import MobileBar from "./MobileBar";

/** Local business data for Google (shows hours, rating, phone in search). */
function JsonLd({ site }: { site: SiteConfig }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "AutoWash",
    name: site.business.name,
    url: site.business.url,
    telephone: `+${(site.contact.phone || "").replace(/\D/g, "")}`,
    email: site.contact.email,
    areaServed: site.mode === "mobile" ? site.business.serviceArea : undefined,
    address:
      site.mode === "studio" && site.business.address
        ? { "@type": "PostalAddress", streetAddress: site.business.address }
        : { "@type": "PostalAddress", addressLocality: site.business.city, addressRegion: site.business.state },
    aggregateRating:
      site.rating.count > 0
        ? { "@type": "AggregateRating", ratingValue: site.rating.score, reviewCount: site.rating.count }
        : undefined,
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

/** Puts the saved order/on-off together with any sections added later. */
export function resolveSections(site: SiteConfig): { id: SectionId; on: boolean }[] {
  const saved = site.sections || [];
  const known = new Set(saved.map((s) => s.id));
  const out = saved.filter((s) => DEFAULT_SECTIONS.some((d) => d.id === s.id));
  // A section added in a later version goes right after the one it follows by default.
  DEFAULT_SECTIONS.forEach((d, i) => {
    if (known.has(d.id)) return;
    const prev = i > 0 ? out.findIndex((s) => s.id === DEFAULT_SECTIONS[i - 1].id) : -1;
    out.splice(prev + 1, 0, d);
  });
  return out;
}

/**
 * The whole public website for one detailer.
 * Used by the real page (published data) and by the admin preview (draft data).
 */
export default function SiteView({ site, banner }: { site: SiteConfig; banner?: ReactNode }) {
  const blocks: Record<SectionId, ReactNode> = {
    hero: <Hero key="hero" site={site} />,
    badges: <TrustBadges key="badges" site={site} />,
    services: <Services key="services" site={site} />,
    calc: <PriceCalculator key="calc" site={site} />,
    beforeafter: <BeforeAfter key="beforeafter" site={site} />,
    photos: <Photos key="photos" site={site} />,
    how: <HowItWorks key="how" site={site} />,
    reviews: <Reviews key="reviews" site={site} />,
    faq: <Faq key="faq" site={site} />,
    map: <MapSection key="map" site={site} />,
    book: <Booking key="book" site={site} />,
  };
  const sections = resolveSections(site).filter((s) => s.on);

  return (
    <div style={accentVars(site.theme.accent) as unknown as CSSProperties}>
      <JsonLd site={site} />
      {banner}
      <Header site={site} />
      <main>{sections.map((s) => blocks[s.id])}</main>
      <Footer site={site} />
      <MobileBar site={site} />
    </div>
  );
}
