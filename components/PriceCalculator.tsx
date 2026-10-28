"use client";

import { useMemo, useState } from "react";
import { site } from "@/site.config";
import { smsHref } from "@/lib/links";
import { CameraIcon } from "./Icons";

export type EstimateSelection = { vehicle: string; service: string; total: number };
export const ESTIMATE_EVENT = "estimate:select";

const money = (n: number) => "$" + n.toLocaleString("en-US");

export default function PriceCalculator() {
  const c = site.calculator;
  const [vehicle, setVehicle] = useState(c.defaults.vehicle);
  const [service, setService] = useState(c.defaults.service);
  const [condition, setCondition] = useState(c.defaults.condition);
  const [addons, setAddons] = useState<Record<string, boolean>>({});

  const result = useMemo(() => {
    const v = c.vehicles.find((x) => x.id === vehicle) ?? c.vehicles[0];
    const s = c.services.find((x) => x.id === service) ?? c.services[0];
    const k = c.conditions.find((x) => x.id === condition) ?? c.conditions[0];
    const picked = c.addons.filter((a) => addons[a.id]);
    const addonTotal = picked.reduce((sum, a) => sum + a.price, 0);
    const total = Math.round(s.price * v.multiplier) + k.add + addonTotal;
    return { v, s, k, picked, addonTotal, total };
  }, [c, vehicle, service, condition, addons]);

  function bookThis() {
    const detail: EstimateSelection = { vehicle: result.v.label, service: result.s.label, total: result.total };
    window.dispatchEvent(new CustomEvent<EstimateSelection>(ESTIMATE_EVENT, { detail }));
    document.getElementById("book")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section id="pricing" className="section">
      <div className="container calc">
        <div className="calc__form">
          <div className="section-head" style={{ marginBottom: 0 }}>
            <span className="eyebrow">Instant estimate</span>
            <h2 className="h2">Build your detail</h2>
            <p style={{ margin: 0, color: "var(--muted)" }}>
              Pick your vehicle and service. Final price is confirmed after we see the car.
            </p>
          </div>

          <fieldset>
            <legend>1. Vehicle type</legend>
            <div className="pills">
              {c.vehicles.map((v) => (
                <button key={v.id} type="button" className="pill" aria-pressed={vehicle === v.id} onClick={() => setVehicle(v.id)}>
                  {v.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>2. Service</legend>
            <div className="pills">
              {c.services.map((s) => (
                <button key={s.id} type="button" className="pill" aria-pressed={service === s.id} onClick={() => setService(s.id)}>
                  {s.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>3. Condition</legend>
            <div className="pills">
              {c.conditions.map((k) => (
                <button key={k.id} type="button" className="pill" aria-pressed={condition === k.id} onClick={() => setCondition(k.id)}>
                  {k.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>4. Add-ons</legend>
            <div className="pills">
              {c.addons.map((a) => {
                const on = Boolean(addons[a.id]);
                return (
                  <label key={a.id} className={on ? "addon addon--on" : "addon"}>
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => setAddons((prev) => ({ ...prev, [a.id]: !prev[a.id] }))}
                    />
                    <span>{a.label}</span>
                    <span className="addon__price">+${a.price}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </div>

        <aside className="summary" aria-live="polite">
          <div className="summary__label">Your estimate</div>
          <div className="stack" style={{ gap: 10 }}>
            <div className="summary__row"><span>Vehicle</span><span>{result.v.label}</span></div>
            <div className="summary__row"><span>Service</span><span>{result.s.label}</span></div>
            <div className="summary__row"><span>Condition</span><span>{result.k.label}</span></div>
            <div className="summary__row">
              <span>Add-ons</span>
              <span>{result.picked.length === 0 ? "None" : `${result.picked.length} · ${money(result.addonTotal)}`}</span>
            </div>
          </div>
          <div className="summary__line" />
          <div className="summary__total">
            <span>Estimated total</span>
            <span className="summary__amount">{money(result.total)}</span>
          </div>
          <button type="button" className="btn btn--accent btn--block" onClick={bookThis}>
            Book this detail
          </button>
          <a href={smsHref} className="btn btn--ghost btn--block btn--photo">
            <CameraIcon size={18} />
            <span>Text a photo for a quote</span>
          </a>
          <p className="summary__note">Estimate only. Price depends on size and condition of the vehicle.</p>
        </aside>
      </div>
    </section>
  );
}
