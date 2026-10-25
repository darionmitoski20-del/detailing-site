import { site } from "@/site.config";
import { AwardIcon, CheckIcon, ShieldIcon, SparkleIcon } from "./Icons";

export default function TrustBadges() {
  const badges = [
    { icon: <ShieldIcon size={22} />, title: "Licensed & Insured", sub: "Your car is covered" },
    { icon: <CheckIcon size={22} />, title: "Satisfaction Guarantee", sub: "Not happy? We redo it" },
    { icon: <AwardIcon size={22} />, title: `${site.business.yearsExperience}+ Years Experience`, sub: "Certified detailers" },
    { icon: <SparkleIcon size={22} />, title: "Pro-Grade Products", sub: "Safe on every finish" },
  ];

  return (
    <section aria-label="Why customers trust us" style={{ borderBottom: "1px solid var(--line)" }}>
      <div className="container badges">
        {badges.map((b) => (
          <div className="badge" key={b.title}>
            <span className="badge__icon">{b.icon}</span>
            <div>
              <div className="badge__title">{b.title}</div>
              <div className="badge__sub">{b.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
