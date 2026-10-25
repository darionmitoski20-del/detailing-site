import { site } from "@/site.config";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import TrustBadges from "@/components/TrustBadges";
import Services from "@/components/Services";
import PriceCalculator from "@/components/PriceCalculator";
import BeforeAfter from "@/components/BeforeAfter";
import HowItWorks from "@/components/HowItWorks";
import Reviews from "@/components/Reviews";
import Faq from "@/components/Faq";
import Booking from "@/components/Booking";
import Footer from "@/components/Footer";
import MobileBar from "@/components/MobileBar";

/** Local business data for Google (shows hours, rating, phone in search). */
function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "AutoWash",
    name: site.business.name,
    url: site.business.url,
    telephone: `+${site.contact.phone}`,
    email: site.contact.email,
    areaServed: site.mode === "mobile" ? site.business.serviceArea : undefined,
    address:
      site.mode === "studio" && site.business.address
        ? { "@type": "PostalAddress", streetAddress: site.business.address }
        : { "@type": "PostalAddress", addressLocality: site.business.city, addressRegion: site.business.state },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: site.rating.score,
      reviewCount: site.rating.count,
    },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default function Home() {
  return (
    <>
      <JsonLd />
      <Header />
      <main>
        <Hero />
        <TrustBadges />
        <Services />
        <PriceCalculator />
        <BeforeAfter />
        <HowItWorks />
        <Reviews />
        <Faq />
        <Booking />
      </main>
      <Footer />
      <MobileBar />
    </>
  );
}
