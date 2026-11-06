import type { Metadata } from "next";
import { Smartphone } from "lucide-react";
import { WalkAppsSection } from "@/components/walk-apps-section";
import { PageKindMark } from "@/components/shadcnio/page-kind";
import { PlainHero } from "@/components/shadcnio/legal";
import { DesignedSitePage } from "@/components/site-page-designer/designed-page";

export const metadata: Metadata = {
  title: "Apps for our walks",
  description: "what3words for exact meeting points and HiiKER for hiking maps — on the App Store and Google Play.",
};

export default async function AppsPage() {
  return (
    <DesignedSitePage page="apps">
      <div className="flex flex-1 flex-col">
        <PageKindMark kind="plain" />
        <PlainHero
          heading="apps-title"
          icon={<Smartphone />}
          lead="Two free apps"
          rest="that make walking with us easier. Download them before your first walk."
          title="Apps for our walks"
          word="APPS"
        />
        <WalkAppsSection plain />
      </div>
    </DesignedSitePage>
  );
}
