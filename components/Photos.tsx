import type { SiteConfig } from "@/site.config";
import { asset } from "@/lib/asset";

/** Simple photo grid of the detailer's work (uploaded in the admin panel). */
export default function Photos({ site }: { site: SiteConfig }) {
  const photos = (site.photos || []).filter(Boolean);
  if (photos.length === 0) return null;
  return (
    <section id="photos" className="section section--white">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Our work</span>
          <h2 className="h2">Recent details</h2>
        </div>
        <div className="photo-grid">
          {photos.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src + i} src={asset(src)} alt={`${site.business.name} work photo ${i + 1}`} loading="lazy" />
          ))}
        </div>
      </div>
    </section>
  );
}
