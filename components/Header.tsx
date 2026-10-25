import { site } from "@/site.config";
import { bookHref, bookIsExternal, telHref } from "@/lib/links";
import { PhoneIcon } from "./Icons";

export default function Header() {
  return (
    <header className="header">
      <div className="container header__inner">
        <a href="#top" className="logo">
          <span className="logo__mark" aria-hidden="true">{site.business.initial}</span>
          <span className="logo__name">{site.business.name}</span>
        </a>
        <nav className="nav" aria-label="Main">
          <a href="#services">Services</a>
          <a href="#pricing">Pricing</a>
          <a href="#gallery">Before &amp; After</a>
          <a href="#reviews">Reviews</a>
          <a href="#faq">FAQ</a>
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
