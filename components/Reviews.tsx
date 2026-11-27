import type { SiteConfig } from "@/site.config";
import { Stars } from "./Icons";

export default function Reviews({ site }: { site: SiteConfig }) {
  const summary = (
    <>
      <span className="rating-box__score">{site.rating.score}</span>
      <span className="stack" style={{ gap: 4 }}>
        <Stars size={16} value={site.rating.score} label={`Rated ${site.rating.score} out of 5`} />
        <span className="rating-box__count">{site.rating.count}{site.rating.fromGoogle ? "" : "+"} Google reviews</span>
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
              <Stars size={16} value={r.rating ?? 5} label={`${r.rating ?? 5} out of 5 stars`} />
              <blockquote>{r.text}</blockquote>
              <figcaption>
                <span className="avatar" aria-hidden="true">
                  {r.photo ? <img src={r.photo} alt="" loading="lazy" referrerPolicy="no-referrer" /> : r.name.charAt(0)}
                </span>
                <span className="stack">
                  {r.url ? (
                    <a className="review__name" href={r.url} target="_blank" rel="noopener noreferrer"><strong>{r.name}</strong></a>
                  ) : (
                    <strong>{r.name}</strong>
                  )}
                  <span className="review__meta">{[r.service, r.when].filter(Boolean).join(" · ")}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
        {site.rating.fromGoogle && (
          <span className="google-note">
            <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"/></svg>
            Reviews from Google
          </span>
        )}
      </div>
    </section>
  );
}
