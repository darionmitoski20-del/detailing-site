/**
 * ============================================================
 *  OFFER CONFIG — YOUR sales page (/for-detailers/), not the client's.
 *  This is where detailers see the packages and prices.
 *
 *  When you build a site for a real client:
 *  set showDemoBanner to false (and you can delete app/for-detailers).
 * ============================================================
 */

export type Package = {
  id: string;
  name: string;
  tagline: string;
  price: number; // one-time
  monthly: number; // hosting & support per month
  launchPrice?: number; // intro price for the first clients (leave empty to hide)
  popular?: boolean;
  features: string[];
};

export const offer = {
  /** Shows a "This is a demo — get this website" bar on top of the demo page. */
  showDemoBanner: true,

  brand: "Detailing Websites",
  initial: "D",

  contact: {
    phoneDisplay: "(862) 386-8493",
    phone: "18623868493", // digits only, with country code
  },

  /** Intro offer for the first clients. Set active to false to hide it. */
  launch: {
    active: true,
    text: "Launch offer: the first 3 detailers get the intro price in exchange for a review.",
  },

  packages: [
    {
      id: "basic",
      name: "Basic Website",
      tagline: "Your own professional website, ready to book clients.",
      price: 499,
      monthly: 29,
      launchPrice: 299,
      features: [
        "Your logo, colors, services and prices",
        "Photo gallery and before / after slider",
        "Price calculator for your customers",
        "Call, text and booking request buttons",
        "Google Maps, reviews and FAQ",
        "Works perfectly on phones",
        "Domain and hosting set up for you",
        "Changes done by us: just text us",
      ],
    },
    {
      id: "admin",
      name: "Website + Admin Panel",
      tagline: "Everything in Basic, and you update the site yourself.",
      price: 899,
      monthly: 49,
      launchPrice: 599,
      popular: true,
      features: [
        "Everything in Basic Website",
        "Your own admin panel",
        "Add and delete photos yourself",
        "Change prices and packages anytime",
        "Add new services and edit texts",
        "No waiting: changes go live right away",
      ],
    },
  ] as Package[],

  steps: [
    { title: "Send us your info", text: "Logo, services, prices and a few photos of your work. That is all we need." },
    { title: "We build it in 7 days", text: "You get a preview link, tell us what to change, and we fix it." },
    { title: "Go live and get booked", text: "Your website goes online on your own domain, ready for clients." },
  ],
};
