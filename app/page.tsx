import SiteView from "@/components/SiteView";
import DemoBanner from "@/components/DemoBanner";
import { getSiteData, isClientSite } from "@/lib/siteData";

export default async function Home() {
  const site = await getSiteData();
  return <SiteView site={site} banner={isClientSite ? null : <DemoBanner />} />;
}
