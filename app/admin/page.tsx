"use client";

import { useEffect, useState } from "react";
import AdminApp from "@/components/admin/AdminApp";

export default function AdminPage() {
  // /admin/?demo opens the demo admin (nothing is saved), so prospects can try it.
  const [demo, setDemo] = useState<boolean | null>(null);
  useEffect(() => {
    setDemo(new URLSearchParams(window.location.search).has("demo"));
  }, []);
  if (demo === null) return null;
  return <AdminApp key={String(demo)} demo={demo} />;
}
