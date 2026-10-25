"use client";

import { useState } from "react";
import { site } from "@/site.config";
import { asset } from "@/lib/asset";
import { ArrowsIcon } from "./Icons";

export default function BeforeAfter() {
  const sets = site.gallery;
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState(50);
  const set = sets[active];

  if (!set) return null;

  return (
    <section id="gallery" className="section section--light">
      <div className="container">
        <div className="section-head section-head--row">
          <div className="stack" style={{ gap: 12, maxWidth: 620 }}>
            <span className="eyebrow">Before &amp; After</span>
            <h2 className="h2">Drag to see the difference</h2>
          </div>
          <div className="tabs" role="group" aria-label="Gallery category">
            {sets.map((s, i) => (
              <button
                key={s.label}
                type="button"
                className="tab"
                aria-pressed={active === i}
                onClick={() => {
                  setActive(i);
                  setPos(50);
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="ba">
          {/* BEFORE (bottom layer) */}
          {set.before ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="ba__img" src={asset(set.before)} alt={`Before: ${set.caption}`} />
          ) : (
            <div className="ba__placeholder" style={{ justifyContent: "flex-end", color: "#f5f5f4" }}>
              Before photo
            </div>
          )}
          <span className="ba__tag ba__tag--before">BEFORE</span>

          {/* AFTER (clipped top layer) */}
          <div className="ba__after" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
            {set.after ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="ba__img" src={asset(set.after)} alt={`After: ${set.caption}`} />
            ) : (
              <div className="ba__placeholder">After photo</div>
            )}
            <span className="ba__tag ba__tag--after">AFTER</span>
          </div>

          <input
            className="ba__range"
            type="range"
            min={0}
            max={100}
            value={pos}
            onChange={(e) => setPos(Number(e.target.value))}
            aria-label="Before and after comparison"
          />
          <div className="ba__handle" style={{ left: `${pos}%` }} aria-hidden="true">
            <span className="ba__knob"><ArrowsIcon size={24} /></span>
          </div>
        </div>
        <p className="ba__caption">{set.caption}</p>
      </div>
    </section>
  );
}
