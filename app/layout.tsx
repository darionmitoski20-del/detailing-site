import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import { Barlow_Condensed, Manrope } from "next/font/google";
import { site, modeCopy } from "@/site.config";
import { accentVars } from "@/lib/color";
import "./globals.css";

const display = Barlow_Condensed({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-display" });
const body = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-body" });

const copy = modeCopy[site.mode];

export const metadata: Metadata = {
  metadataBase: new URL(site.business.url),
  title: `${site.business.name} | ${site.business.tagline} in ${site.business.city}, ${site.business.state}`,
  description: `${copy.heroSub} Call ${site.contact.phoneDisplay} or book online.`,
  openGraph: {
    title: site.business.name,
    description: copy.heroTitle,
    type: "website",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body style={accentVars(site.theme.accent) as unknown as CSSProperties}>{children}</body>
    </html>
  );
}
