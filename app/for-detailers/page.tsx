import type { Metadata } from "next";
import Link from "next/link";
import { offer } from "@/offer.config";
import LeadForm from "@/components/offer/LeadForm";
import { CheckIcon, MessageIcon, PhoneIcon } from "@/components/Icons";

export const metadata: Metadata = {
  title: "Websites for Car Detailers | Packages & Prices",
  description: "Professional websites for mobile and studio car detailers. Online booking requests, price calculator, gallery. Live in 7 days.",
  openGraph: {
    title: "Websites for Car Detailers",
    description: "A website that books clients while you work. Live in 7 days.",
    type: "website",
  },
};

const tel = `tel:+${offer.contact.phone}`;
const sms = `sms:+${offer.contact.phone}`;
const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

export default function ForDetailers() {
  return (
    <>
      <header className="header">
        <div className="container header__inner">
          <Link href="/for-detailers/" className="logo">
            <span className="logo__mark" aria-hidden="true">{offer.initial}</span>
            <span className="logo__name">{offer.brand}</span>
          </Link>
          <div className="header__actions">
            <Link href="/" className="btn btn--ghost btn--sm offer__demo-btn">Live demo</Link>
            <a href="#start" className="btn btn--accent btn--sm">Get started</a>
          </div>
        </div>
      </header>

      <main>
        <section className="offer-hero">
          <div className="container offer-hero__inner">
            <span className="eyebrow">For car detailers · mobile &amp; studio</span>
            <h1 className="h1">A website that books clients while you work.</h1>
            <p className="hero__sub">
              Your customers search Google before they book. Show them your work, your prices and an easy way to
              book, on a fast website made just for detailers. Live in 7 days.
            </p>
            <div className="hero__ctas">
              <Link href="/" className="btn btn--white">See the live demo</Link>
              <a href="#packages" className="btn btn--accent">View packages</a>
            </div>
          </div>
        </section>

        <section id="packages" className="section section--light">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">Packages</span>
              <h2 className="h2">Simple pricing. No surprises.</h2>
            </div>
            {offer.launch.active ? <p className="launch">{offer.launch.text}</p> : null}
            <div className="plans">
              {offer.packages.map((p) => (
                <article key={p.id} className={`plan${p.popular ? " plan--popular" : ""}`}>
                  {p.popular ? <span className="plan__badge">Most popular</span> : null}
                  <h3 className="plan__name">{p.name}</h3>
                  <p className="plan__tagline">{p.tagline}</p>
                  <div className="plan__price">
                    {offer.launch.active && p.launchPrice ? (
                      <>
                        <span className="plan__amount">{usd(p.launchPrice)}</span>
                        <s className="plan__old">{usd(p.price)}</s>
                      </>
                    ) : (
                      <span className="plan__amount">{usd(p.price)}</span>
                    )}
                    <span className="plan__once">one-time</span>
                  </div>
                  <p className="plan__monthly">+ {usd(p.monthly)}/month hosting, domain &amp; support</p>
                  <ul className="plan__features">
                    {p.features.map((f) => (
                      <li key={f}><CheckIcon size={18} /> <span>{f}</span></li>
                    ))}
                  </ul>
                  <a href="#start" className={`btn btn--block ${p.popular ? "btn--accent" : "btn--dark"}`}>
                    Choose {p.name}
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section section--white">
          <div className="container">
            <div className="section-head">
              <h2 className="h2">How it works</h2>
            </div>
            <ol className="steps">
              {offer.steps.map((s, i) => (
                <li className="step" key={s.title}>
                  <span className="step__num">{String(i + 1).padStart(2, "0")}</span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="start" className="section book">
          <div className="container book__grid">
            <div className="book__intro">
              <h2 className="h2">Ready to get more bookings?</h2>
              <p>Tell us about your business and we will text you back the same day with next steps.</p>
              <div className="book__links">
                <a href={tel} className="btn btn--white"><PhoneIcon /> Call {offer.contact.phoneDisplay}</a>
                <a href={sms} className="btn btn--ghost"><MessageIcon /> Text us</a>
              </div>
            </div>
            <LeadForm />
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer__bottom">
          © {new Date().getFullYear()} {offer.brand}. Websites for car detailers.
        </div>
      </footer>
    </>
  );
}
