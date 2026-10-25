import { bookHref, bookIsExternal, smsHref, telHref } from "@/lib/links";

/** Sticky contact bar shown only on phones. */
export default function MobileBar() {
  return (
    <div className="mobile-bar">
      <a href={telHref} className="btn btn--white">Call</a>
      <a href={smsHref} className="btn btn--ghost">Text</a>
      <a
        href={bookHref}
        className="btn btn--accent"
        {...(bookIsExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        Book
      </a>
    </div>
  );
}
