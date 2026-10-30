import type { Metadata } from "next";
import { WalkAppsSection } from "@/components/walk-apps-section";
import { PAGE_X_BLEED } from "@/lib/page-x";
import { getSiteTheme } from "@/lib/site-theme";
import { PageKindMark } from "@/components/shadcnio/page-kind";

export const metadata: Metadata = {
  title: "Apps for our walks",
  description: "what3words for exact meeting points and HiiKER for hiking maps — on the App Store and Google Play.",
};

export default async function AppsPage() {
  const theme = await getSiteTheme();
  if (theme.siteDesign === "shadcnio") {
    // A main-site page, as Contact: the site's header and footer even for signed-in
    // people, never inside the dashboard.
    return (
      <div className="flex flex-1 flex-col">
        <PageKindMark kind="plain" />
        <WalkAppsSection />
      </div>
    );
  }
  return (
    <div className={`-mt-6 -mb-6 ${PAGE_X_BLEED}`}>
      <WalkAppsSection />
    </div>
  );
}
