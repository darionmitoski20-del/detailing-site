"use client";

import { useEffect, useState } from "react";
import SiteView from "@/components/SiteView";
import { withDefaults } from "@/lib/siteData";
import type { SiteConfig } from "@/site.config";
import { PREVIEW_KEY } from "@/components/admin/useAdmin";

/** Shows the website with the unpublished changes from the admin. */
export default function PreviewPage() {
  const [site, setSite] = useState<SiteConfig | null>(null);

  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem(PREVIEW_KEY);
        setSite(withDefaults(raw ? JSON.parse(raw) : null));
      } catch {
        setSite(withDefaults(null));
      }
    };
    load();
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, []);

  if (!site) return null;
  return (
    <div style={{ background: "var(--bg, #0b0b0c)" }}>
      <div style={{ position: "sticky", top: 0, zIndex: 100, background: "#FDE68A", color: "#0B0B0C", textAlign: "center", padding: "8px 12px", fontWeight: 700, fontSize: 14 }}>
        Preview — not live yet. Go back to the admin and press Publish.
      </div>
      <SiteView site={site} />
    </div>
  );
}
