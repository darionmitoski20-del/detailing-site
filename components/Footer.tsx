import { site } from "@/site.config";
import { telHref } from "@/lib/links";

export default function Footer() {
  const where =
    site.mode === "mobile"
      ? `Mobile detailing serving ${site.business.serviceArea.join(", ")} and nearby.`
      : site.business.address;

  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div className="footer__col footer__col--wide">
          <span className="logo__name">{site.business.name}</span>
          <span style={{ lineHeight: 1.6, color: "var(--muted)" }}>{where}</span>
        </div>
        <div className="footer__col">
          <span className="footer__head">Hours</span>
          {site.business.hours.map((h) => (
            <span key={h.days}>{h.days} · {h.time}</span>
          ))}
        </div>
        <div className="footer__col">
          <span className="footer__head">Contact</span>
          <a href={telHref}>{site.contact.phoneDisplay}</a>
          <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>
          {site.contact.instagram ? <a href={site.contact.instagram} target="_blank" rel="noopener noreferrer">Instagram</a> : null}
          {site.contact.facebook ? <a href={site.contact.facebook} target="_blank" rel="noopener noreferrer">Facebook</a> : null}
        </div>
      </div>
      <div className="container footer__bottom">
        © {new Date().getFullYear()} {site.business.name}. All rights reserved.
      </div>
    </footer>
  );
}
