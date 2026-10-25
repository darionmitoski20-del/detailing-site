import { site } from "@/site.config";

export const telHref = `tel:+${site.contact.phone}`;
export const smsHref = `sms:+${site.contact.phone}`;
export const whatsappHref = site.contact.whatsapp ? `https://wa.me/${site.contact.whatsapp}` : "";
export const bookHref = site.contact.bookingUrl || "#book";
export const bookIsExternal = Boolean(site.contact.bookingUrl);
