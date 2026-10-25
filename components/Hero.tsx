import { site, modeCopy } from "@/site.config";
import { bookHref, bookIsExternal, smsHref, telHref, whatsappHref } from "@/lib/links";
import { asset } from "@/lib/asset";
import { CalendarIcon, MessageIcon, PhoneIcon, Stars } from "./Icons";

export default function Hero() {
  const copy = modeCopy[site.mode];
  const area = site.mode === "mobile" ? `Serving ${site.business.serviceArea.slice(0, 3).join(", ")} & more` : site.business.address;

  return (
    <section id="top" className="hero">
      {site.hero.video ? (
        <video
          className="hero__video"
          src={asset(site.hero.video)}
          poster={asset(site.hero.poster)}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        />
      ) : site.hero.poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="hero__video" src={asset(site.hero.poster)} alt="" aria-hidden="true" />
      ) : null}
      <div className="hero__shade" aria-hidden="true" />

      <div className="container hero__inner">
        <span className="eyebrow">{copy.eyebrow(site)}</span>
        <h1 className="h1">{copy.heroTitle}</h1>
        <p className="hero__sub">{copy.heroSub}</p>

        <div className="hero__ctas">
          <a
            href={bookHref}
            className="btn btn--accent"
            {...(bookIsExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            <CalendarIcon /> Book Online
          </a>
          <a href={telHref} className="btn btn--white">
            <PhoneIcon /> Call Now
          </a>
          <a href={whatsappHref || smsHref} className="btn btn--ghost">
            <MessageIcon /> {whatsappHref ? "Text / WhatsApp" : "Text Us"}
          </a>
        </div>

        <div className="hero__trust">
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Stars label={`Rated ${site.rating.score} out of 5`} />
            <strong>{site.rating.score}</strong> on Google · {site.rating.count}+ reviews
          </span>
          <span className="divider" aria-hidden="true" />
          <span>Licensed &amp; insured</span>
          {area ? (
            <>
              <span className="divider" aria-hidden="true" />
              <span>{area}</span>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
