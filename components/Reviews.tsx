import { site } from "@/site.config";
import { Stars } from "./Icons";

export default function Reviews() {
  const summary = (
    <>
      <span className="rating-box__score">{site.rating.score}</span>
      <span className="stack" style={{ gap: 4 }}>
        <Stars size={16} label={`Rated ${site.rating.score} out of 5`} />
        <span className="rating-box__count">{site.rating.count}+ Google reviews</span>
      </span>
    </>
  );

  return (
    <section id="reviews" className="section">
      <div className="container">
        <div className="section-head section-head--row">
          <div className="stack" style={{ gap: 12 }}>
            <span className="eyebrow">Reviews</span>
            <h2 className="h2">What our customers say</h2>
          </div>
          {site.contact.googleReviewsUrl ? (
            <a className="rating-box" href={site.contact.googleReviewsUrl} target="_blank" rel="noopener noreferrer">
              {summary}
            </a>
          ) : (
            <div className="rating-box">{summary}</div>
          )}
        </div>
        <div className="cards">
          {site.reviews.map((r, i) => (
            <figure className="review" key={i}>
              <Stars size={16} />
              <blockquote>{r.text}</blockquote>
              <figcaption>
                <span className="avatar" aria-hidden="true">{r.name.charAt(0)}</span>
                <span className="stack">
                  <strong>{r.name}</strong>
                  <span className="review__meta">{r.service} · {r.when}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
