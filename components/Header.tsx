import type { SiteConfig } from "@/site.config";
import { links } from "@/lib/links";
import { asset } from "@/lib/asset";
import { DEFAULT_SECTIONS, type SectionId } from "@/site.config";
import { PhoneIcon } from "./Icons";

export default function Header({ site }: { site: SiteConfig }) {
  // Menu shows only sections that are turned on and have content.
  const on = (id: SectionId) => (site.sections || DEFAULT_SECTIONS).find((x) => x.id === id)?.on ?? true;
  const { bookHref, bookIsExternal, telHref } = links(site);
  return (
    <header className="header">
      <div className="container header__inner">
        <a href="#top" className="logo">
          {site.business.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="logo__img" src={asset(site.business.logo)} alt="" aria-hidden="true" />
          ) : (
            <span className="logo__mark" aria-hidden="true">{site.business.initial}</span>
          )}
          <span className="logo__name">{site.business.name}</span>
        </a>
        <nav className="nav" aria-label="Main">
          {on("services") && site.services.some((x) => !x.hidden) && <a href="#services">Services</a>}
          {on("calc") && <a href="#pricing">Pricing</a>}
          {on("beforeafter") && site.gallery.some((g) => g.before && g.after) && <a href="#gallery">Before &amp; After</a>}
          {on("reviews") && site.reviews.length > 0 && <a href="#reviews">Reviews</a>}
          {on("faq") && site.faq.length > 0 && <a href="#faq">FAQ</a>}
        </nav>
        <div className="header__actions">
          <a href={telHref} className="header__phone" aria-label={`Call ${site.contact.phoneDisplay}`}>
            <PhoneIcon size={18} />
            <span>{site.contact.phoneDisplay}</span>
          </a>
          <a
            href={bookHref}
            className="btn btn--accent btn--sm"
            {...(bookIsExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            Book Now
          </a>
        </div>
      </div>
    </header>
  );
}
