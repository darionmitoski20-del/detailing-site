"use client";

import { useId, useState } from "react";
import { site, modeCopy } from "@/site.config";

export default function Faq() {
  const copy = modeCopy[site.mode];
  const first =
    site.mode === "studio"
      ? { q: copy.firstFaq.q, a: site.business.address ?? "" }
      : copy.firstFaq;
  const items = [first, ...site.faq].filter((f) => f.a);
  const [open, setOpen] = useState(0);
  const baseId = useId();

  return (
    <section id="faq" className="section section--light">
      <div className="container faq">
        <div className="section-head">
          <h2 className="h2">Questions</h2>
        </div>
        <div className="faq__list">
          {items.map((f, i) => {
            const isOpen = open === i;
            const panelId = `${baseId}-faq-${i}`;
            return (
              <div className="faq__item" key={f.q}>
                <button
                  type="button"
                  className="faq__q"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpen(isOpen ? -1 : i)}
                >
                  <span>{f.q}</span>
                  <span className="faq__sign" aria-hidden="true">{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen ? (
                  <p className="faq__a" id={panelId}>{f.a}</p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
