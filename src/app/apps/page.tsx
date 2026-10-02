import type { Metadata } from "next";
import { WalkAppsSection } from "@/components/walk-apps-section";
import { PAGE_X_BLEED } from "@/lib/page-x";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = {
  title: "Apps for our walks",
  description: "what3words for exact meeting points and HiiKER for hiking maps — on the App Store and Google Play.",
};

export default function AppsPage() {
  return (
    <div className={`-mt-6 -mb-6 ${PAGE_X_BLEED}`}>
      <WalkAppsSection />
    </div>
  );
}
