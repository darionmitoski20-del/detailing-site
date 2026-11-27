import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import { Barlow_Condensed, Manrope } from "next/font/google";
import { modeCopy } from "@/site.config";
import { accentVars } from "@/lib/color";
import { getSiteData } from "@/lib/siteData";
import "./globals.css";

const display = Barlow_Condensed({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-display" });
const body = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-body" });

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteData();
  const copy = modeCopy[site.mode];
  let base: URL | undefined;
  try {
    base = new URL(site.business.url);
  } catch {
    base = undefined;
  }
  return {
    metadataBase: base,
    title: `${site.business.name} | ${site.business.tagline} in ${site.business.city}, ${site.business.state}`,
    description: `${copy.heroSub} Call ${site.contact.phoneDisplay} or book online.`,
    openGraph: { title: site.business.name, description: copy.heroTitle, type: "website" },
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const site = await getSiteData();
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body style={accentVars(site.theme.accent) as unknown as CSSProperties}>{children}</body>
    </html>
  );
}
