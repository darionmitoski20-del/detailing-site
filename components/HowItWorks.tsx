import { site, modeCopy } from "@/site.config";

export default function HowItWorks() {
  const copy = modeCopy[site.mode];
  const steps = [
    { title: "Book in 60 seconds", text: "Book online, call, or text us. Pick a time that works for you." },
    { title: copy.step2Title, text: copy.step2Text },
    { title: "Drive away spotless", text: "Pay online when you are happy with the result. No paperwork." },
  ];

  return (
    <section className="section section--white">
      <div className="container">
        <div className="section-head">
          <h2 className="h2">How it works</h2>
        </div>
        <ol className="steps">
          {steps.map((s, i) => (
            <li className="step" key={s.title}>
              <span className="step__num">{String(i + 1).padStart(2, "0")}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
