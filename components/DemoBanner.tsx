import Link from "next/link";
import { offer } from "@/offer.config";

/** Top bar on the demo page that sends detailers to the packages page. Hidden for real clients. */
export default function DemoBanner() {
  if (!offer.showDemoBanner) return null;
  return (
    <div className="demo-bar">
      <span>This is a demo website for car detailers.</span>
      <Link href="/for-detailers/" className="demo-bar__link">Get this website for your business →</Link>
    </div>
  );
}
