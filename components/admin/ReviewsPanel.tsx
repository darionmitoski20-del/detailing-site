"use client";

import type { Review, SiteConfig } from "@/site.config";
import type { Admin } from "./useAdmin";

/** Only for you (platform admin): reviews, rating and FAQ of the selected client. */
export default function ReviewsPanel({ a }: { a: Admin }) {
  const d = a.draft;
  const set = a.update;
  const setReview = (i: number, patch: Partial<Review>) =>
    set((x) => ({ ...x, reviews: x.reviews.map((r, j) => (j === i ? { ...r, ...patch } : r)) }));
  const setFaq = (i: number, patch: Partial<SiteConfig["faq"][number]>) =>
    set((x) => ({ ...x, faq: x.faq.map((f, j) => (j === i ? { ...f, ...patch } : f)) }));
  function move<T>(list: T[], i: number, dir: -1 | 1): T[] {
    const j = i + dir;
    if (j < 0 || j >= list.length) return list;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  }

  return (
    <div className="adm-stack">
      {d.googleReviews && a.isPro && (
        <div className="adm-banner">This client is on Pro with Google reviews on — the website shows live Google reviews, and the ones below are only a backup.</div>
      )}

      <section className="adm-card">
        <div className="adm-card__head">
          <div>
            <h3>Google rating</h3>
            <p className="adm-muted adm-small">Copy it from the client’s Google profile. Shows at the top of the website. Number of reviews 0 = hidden.</p>
          </div>
        </div>
        <div className="adm-grid2">
          <label className="adm-field"><span>Rating (1–5)</span>
            <input inputMode="decimal" value={String(d.rating.score)}
              onChange={(e) => set((x) => ({ ...x, rating: { ...x.rating, score: Math.min(5, Math.max(1, Number(e.target.value.replace(",", ".").replace(/[^\d.]/g, "")) || 5)), fromGoogle: false } }))} />
          </label>
          <label className="adm-field"><span>Number of reviews</span>
            <input inputMode="numeric" value={String(d.rating.count)}
              onChange={(e) => set((x) => ({ ...x, rating: { ...x.rating, count: Number(e.target.value.replace(/\D/g, "")) || 0, fromGoogle: false } }))} />
          </label>
          <label className="adm-field adm-field--wide"><span>Link to all reviews on Google (optional — the Google Maps link is used if empty)</span>
            <input value={d.contact.googleReviewsUrl || ""} placeholder="https://g.page/r/…"
              onChange={(e) => set((x) => ({ ...x, contact: { ...x.contact, googleReviewsUrl: e.target.value.trim() } }))} />
          </label>
        </div>
      </section>

      <section className="adm-card">
        <div className="adm-card__head">
          <div>
            <h3>Reviews ({d.reviews.length})</h3>
            <p className="adm-muted adm-small">Copy 3–6 of the client’s best Google reviews. No reviews = the section is hidden.</p>
          </div>
        </div>
        <div className="adm-rows">
          {d.reviews.map((r, i) => (
            <div key={i} className="adm-review-edit">
              <div className="adm-grid2">
                <label className="adm-field"><span>Name</span><input value={r.name} onChange={(e) => setReview(i, { name: e.target.value })} placeholder="Mike R." /></label>
                <label className="adm-field"><span>When</span><input value={r.when} onChange={(e) => setReview(i, { when: e.target.value })} placeholder="2 weeks ago" /></label>
                <label className="adm-field"><span>Stars</span>
                  <select value={r.rating ?? 5} onChange={(e) => setReview(i, { rating: Number(e.target.value) })}>
                    {[5, 4, 3].map((n) => <option key={n} value={n}>{"★".repeat(n)} ({n})</option>)}
                  </select>
                </label>
                <label className="adm-field"><span>Service (optional)</span><input value={r.service} onChange={(e) => setReview(i, { service: e.target.value })} placeholder="Full Detail" /></label>
                <label className="adm-field adm-field--wide"><span>Review text</span><textarea rows={3} value={r.text} onChange={(e) => setReview(i, { text: e.target.value })} /></label>
              </div>
              <div className="adm-inline">
                <button type="button" className="adm-icon-btn" aria-label="Move up" onClick={() => set((x) => ({ ...x, reviews: move(x.reviews, i, -1) }))}>↑</button>
                <button type="button" className="adm-icon-btn" aria-label="Move down" onClick={() => set((x) => ({ ...x, reviews: move(x.reviews, i, 1) }))}>↓</button>
                <button type="button" className="adm-link adm-link--danger" onClick={() => { if (window.confirm(`Delete the review from ${r.name || "this person"}?`)) set((x) => ({ ...x, reviews: x.reviews.filter((_, j) => j !== i) })); }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
        <button type="button" className="adm-btn adm-btn--ghost"
          onClick={() => set((x) => ({ ...x, reviews: [...x.reviews, { name: "", text: "", service: "", when: "", rating: 5 }] }))}>+ Add review</button>
      </section>

      <section className="adm-card">
        <div className="adm-card__head">
          <div>
            <h3>Questions (FAQ) ({d.faq.length})</h3>
            <p className="adm-muted adm-small">The questions customers see near the bottom of the website.</p>
          </div>
        </div>
        <div className="adm-rows">
          {d.faq.map((f, i) => (
            <div key={i} className="adm-review-edit">
              <label className="adm-field"><span>Question</span><input value={f.q} onChange={(e) => setFaq(i, { q: e.target.value })} /></label>
              <label className="adm-field"><span>Answer</span><textarea rows={2} value={f.a} onChange={(e) => setFaq(i, { a: e.target.value })} /></label>
              <div className="adm-inline">
                <button type="button" className="adm-icon-btn" aria-label="Move up" onClick={() => set((x) => ({ ...x, faq: move(x.faq, i, -1) }))}>↑</button>
                <button type="button" className="adm-icon-btn" aria-label="Move down" onClick={() => set((x) => ({ ...x, faq: move(x.faq, i, 1) }))}>↓</button>
                <button type="button" className="adm-link adm-link--danger" onClick={() => { if (window.confirm("Delete this question?")) set((x) => ({ ...x, faq: x.faq.filter((_, j) => j !== i) })); }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
        <button type="button" className="adm-btn adm-btn--ghost" onClick={() => set((x) => ({ ...x, faq: [...x.faq, { q: "", a: "" }] }))}>+ Add question</button>
      </section>
    </div>
  );
}
