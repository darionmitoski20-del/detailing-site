"use client";

import { useEffect, useState } from "react";
import AdminApp from "@/components/admin/AdminApp";

export default function AdminPage() {
  // /admin/?demo opens the demo admin (nothing is saved), so prospects can try it.
  const [demo, setDemo] = useState<"off" | "on" | "setup" | null>(null);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setDemo(!q.has("demo") ? "off" : q.get("demo") === "setup" ? "setup" : "on");
  }, []);
  if (demo === null) return null;
  return <AdminApp key={demo} demo={demo !== "off"} demoSetup={demo === "setup"} />;
}
