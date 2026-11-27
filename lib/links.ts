import type { SiteConfig } from "@/site.config";

/** Call / text / booking links for one site. */
export function links(site: SiteConfig) {
  const phone = (site.contact.phone || "").replace(/\D/g, "");
  const wa = (site.contact.whatsapp || "").replace(/\D/g, "");
  return {
    telHref: `tel:+${phone}`,
    smsHref: `sms:+${phone}`,
    whatsappHref: wa ? `https://wa.me/${wa}` : "",
    bookHref: site.contact.bookingUrl || "#book",
    bookIsExternal: Boolean(site.contact.bookingUrl),
  };
}
