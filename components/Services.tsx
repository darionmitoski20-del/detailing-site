import { site } from "@/site.config";
import { asset } from "@/lib/asset";

export default function Services() {
  return (
    <section id="services" className="section section--light">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Services</span>
          <h2 className="h2">Everything your car needs, inside and out</h2>
        </div>
        <div className="cards">
          {site.services.map((s) => (
            <article className="card" key={s.name}>
              <div className="card__media">
                {s.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={asset(s.image)} alt={s.name} loading="lazy" />
                ) : (
                  <span>{s.name} photo</span>
                )}
              </div>
              <div className="card__body">
                <div className="card__top">
                  <h3 className="card__title">{s.name}</h3>
                  <span className="card__price">from ${s.from}</span>
                </div>
                <p className="card__text">{s.description}</p>
                <a href="#pricing" className="card__link">Get an estimate →</a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
