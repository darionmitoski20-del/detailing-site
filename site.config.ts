/**
 * ============================================================
 *  SITE CONFIG — change this file for every new client.
 *  Everything on the page (name, phone, colors, prices, reviews,
 *  FAQ) comes from here. You should not need to touch components.
 * ============================================================
 */

export type Mode = "mobile" | "studio";

export type Service = {
  name: string;
  from: number; // "from $X" price shown on the card
  description: string;
  image?: string; // e.g. "/images/full-detail.jpg" (put file in /public/images)
};

export type Review = {
  name: string;
  text: string;
  service: string;
  when: string; // e.g. "2 weeks ago"
};

export type GallerySet = {
  label: string;
  caption: string;
  before?: string; // "/images/before-interior.jpg"
  after?: string; // "/images/after-interior.jpg"};

export type SiteConfig = {
  mode: Mode;
  business: {
    name: string;
    initial: string;
    tagline: string;
    city: string;
    state: string;
    address?: string; // studio address (used when mode = "studio")
    serviceArea: string[]; // towns (used when mode = "mobile")
    yearsExperience: number;
    hours: { days: string; time: string }[];
    url: string;
  };
  contact: {
    phoneDisplay: string;
    phone: string; // digits only, with country code: "12015550000"
    whatsapp?: string; // digits only, with country code
    email: string;
    bookingUrl?: string; // external booking link (Square, Calendly, Urable...). If empty, buttons go to the form.
    instagram?: string;
    facebook?: string;
    googleReviewsUrl?: string;
  };
  theme: {
    accent: string; // main brand color, e.g. "#E11D2E"
  };
  hero: {
    video?: string; // "/video/hero.mp4" (put file in /public/video)
    poster?: string; // "/images/hero-poster.jpg" — shown while the video loads
  };
  rating: { score: number; count: number };
  services: Service[];
  calculator: {
    vehicles: { id: string; label: string; multiplier: number }[];
    services: { id: string; label: string; price: number }[];
    conditions: { id: string; label: string; add: number }[];
    addons: { id: string; label: string; price: number }[];
    defaults: { vehicle: string; service: string; condition: string };
  };
  gallery: GallerySet[];
  reviews: Review[];
  faq: { q: string; a: string }[];
};

// Unsplash image helpers (resized, compressed on their CDN)
const U = "https://images.unsplash.com/";
const Q = (w: number) => `?w=${w}&q=75&auto=format&fit=crop`;

export const site: SiteConfig = {
  mode: "mobile",

  business: {
    name: "Shine Pro Detailing",
    initial: "S",
    tagline: "Mobile car detailing",
    city: "Wallington",
    state: "NJ",
    address: "123 Main St, Wallington, NJ 07057",
    serviceArea: ["Wallington", "Garfield", "Clifton", "Lodi", "Passaic", "Hackensack"],
    yearsExperience: 10,
    hours: [
      { days: "Mon – Sat", time: "8 AM – 6 PM" },
      { days: "Sunday", time: "Closed" },
    ],
    url: "https://example.com",
  },

  contact: {
    phoneDisplay: "(201) 555-0000",
    phone: "12015550000",
    whatsapp: "12015550000",
    email: "hello@example.com",
    bookingUrl: "",
    instagram: "https://instagram.com/",
    facebook: "https://facebook.com/",
    googleReviewsUrl: "",
  },

  theme: {
    accent: "#E11D2E",
  },

  // Demo media: free stock from Pexels (video) and Unsplash (photos).
  // Replace with the client's own photos/videos in /public before going live.
  hero: {
    video: "https://videos.pexels.com/video-files/6159290/6159290-hd_1280_720_30fps.mp4",
    poster: `${U}photo-1761312834150-4beefff097a7${Q(1600)}`,
  },

  rating: { score: 4.9, count: 120 },

  services: [
    { name: "Full Detail", from: 375, description: "Our most popular package. Interior and exterior, restored to showroom condition.", image: `${U}photo-1567808291548-fc3ee04dbcf0${Q(800)}` },
    { name: "Interior Detail", from: 245, description: "Deep vacuum, shampoo, steam, leather care and glass. Smells new again.", image: `${U}photo-1771491237209-b89bc7290588${Q(800)}` },
    { name: "Exterior Detail", from: 155, description: "Foam hand wash, wheels and tires, decontamination and sealant.", image: `${U}photo-1694678505383-676d78ea3b96${Q(800)}` },
    { name: "Ceramic Coating", from: 899, description: "Long-term gloss and protection that makes every wash easier.", image: `${U}photo-1554294314-80a5fb7e6bd5${Q(800)}` },
    { name: "Paint Correction", from: 450, description: "Machine polishing to remove swirls, light scratches and water spots.", image: `${U}photo-1780558852670-3f49298ecc1f${Q(800)}` },
    { name: "Odor Removal", from: 95, description: "Enzyme and ozone treatment for smoke, pets and spills.", image: `${U}photo-1771491237218-cbd4a707497e${Q(800)}` },
  ],

  calculator: {
    vehicles: [
      { id: "sedan", label: "Sedan / Coupe", multiplier: 1 },
      { id: "suv", label: "SUV / Crossover", multiplier: 1.2 },
      { id: "truck", label: "Truck / Van", multiplier: 1.35 },
    ],
    services: [
      { id: "exterior", label: "Exterior", price: 155 },
      { id: "interior", label: "Interior", price: 245 },
      { id: "full", label: "Full Detail", price: 375 },
      { id: "ceramic", label: "Ceramic Coating", price: 899 },
    ],
    conditions: [
      { id: "light", label: "Light", add: 0 },
      { id: "average", label: "Average", add: 40 },
      { id: "heavy", label: "Heavy (stains, pet hair)", add: 90 },
    ],
    addons: [
      { id: "pet", label: "Pet hair removal", price: 45 },
      { id: "odor", label: "Odor removal", price: 75 },
      { id: "engine", label: "Engine bay", price: 40 },
      { id: "headlight", label: "Headlight restore", price: 60 },
    ],
    defaults: { vehicle: "sedan", service: "full", condition: "average" },
  },

  gallery: [
    // Demo pairs from stock photos — replace with the client's real before/after shots of the same car.
    { label: "Interior", caption: "Interior detail · seat shampoo & extraction", before: `${U}photo-1770936450010-6837d6933caa${Q(1400)}`, after: `${U}photo-1770936560291-c75286720ff5${Q(1400)}` },
    { label: "Exterior", caption: "Exterior wash & sealant · mud, road film", before: `${U}photo-1770935883781-a2f5a52b69da${Q(1400)}`, after: `${U}photo-1770936044591-979681c051cf${Q(1400)}` },  ],

  reviews: [
    { name: "Customer Name", text: "Replace with a real Google review — what was done and how the car looked after.", service: "Full Detail", when: "2 weeks ago" },
    { name: "Customer Name", text: "Replace with a real Google review — punctuality, communication, the detailer by name.", service: "Interior Detail", when: "1 month ago" },
    { name: "Customer Name", text: "Replace with a real Google review — a tough job: pet hair, stains, odor or paint.", service: "Paint Correction", when: "1 month ago" },
  ],

  faq: [
    { q: "How long does a detail take?", a: "Usually 2–4 hours depending on vehicle size and condition." },
    { q: "Do I need to be present?", a: "No — we just need access to the keys. Payment is handled online." },
    { q: "Can you remove scratches?", a: "Light swirls and clear-coat scratches, yes. Send us a photo for an honest answer." },
    { q: "How do I pay?", a: "Card, cash, Venmo or Zelle. A small deposit holds your spot." },
  ],
};

/** Copy that changes between a mobile detailer and a studio. */
export const modeCopy = {
  mobile: {
    eyebrow: (s: SiteConfig) => `Mobile car detailing · ${s.business.city}, ${s.business.state}`,
    heroTitle: "Showroom shine. Right in your driveway.",
    heroSub:
      "We bring the water, power and pro-grade products to your home or office. You get your car back looking brand new.",
    step2Title: "We come to you",
    step2Text: "Home or work. We bring our own water and power, so you do not need anything.",
    firstFaq: { q: "Do I need to provide water or power?", a: "No — our van carries its own water tank and generator." },
    addressLabel: "Service address",
    addressPlaceholder: "Street, town",
  },
  studio: {
    eyebrow: (s: SiteConfig) => `Car detailing studio · ${s.business.city}, ${s.business.state}`,
    heroTitle: "Showroom shine. Done by hand.",
    heroSub:
      "Drop off your car at our studio and pick it up looking brand new. Hand wash, interior, ceramic coating and paint correction.",
    step2Title: "Drop off at our studio",
    step2Text: "Leave the keys with us. We text you updates and photos while we work.",
    firstFaq: { q: "Where are you located?", a: "" }, // filled from business.address
    addressLabel: "Anything we should know?",
    addressPlaceholder: "Stains, pet hair, scratches...",
  },
} as const;
