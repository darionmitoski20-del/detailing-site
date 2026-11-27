import type { SiteConfig } from "@/site.config";
import { mapEmbedSrc, mapsLink } from "@/lib/maps";

export default function MapSection({ site }: { site: SiteConfig }) {
  const b = site.business;
  const mobile = site.mode === "mobile";
  return (
    <section id="location" className="section">
      <div className="container map-wrap">
        <div className="stack map-info" style={{ gap: 16 }}>
          <span className="eyebrow">{mobile ? "Service area" : "Location"}</span>
          <h2 className="h2">{mobile ? "We come to you" : "Find us"}</h2>
          {mobile ? (
            <p className="map-text">Mobile detailing in {b.serviceArea.join(", ")} and nearby towns.</p>
          ) : (
            <p className="map-text">{b.address || `${b.city}, ${b.state}`}</p>
          )}
          <div className="map-hours">
            {b.hours.map((h) => (
              <div key={h.days}><span>{h.days}</span><strong>{h.time}</strong></div>
            ))}
          </div>
          <a className="btn btn--accent" href={mapsLink(site)} target="_blank" rel="noopener noreferrer">
            {mobile ? "Open in Google Maps" : "Get directions"}
          </a>
        </div>
        <div className="map-frame">
          <iframe
            title={`Map of ${b.name}`}
            src={mapEmbedSrc(site)}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </div>
    </section>
  );
}
