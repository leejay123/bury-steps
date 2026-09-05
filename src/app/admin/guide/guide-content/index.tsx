import { Accordion } from "@/components/ui/accordion";
import { OverviewSection } from "./overview-section";
import { WalksSection } from "./walks-section";
import { RoutesSection } from "./routes-section";
import { ProgressClockInSection } from "./progress-clockin-section";
import { MembersSection } from "./members-section";
import { HomepageNoticesSection } from "./homepage-notices-section";
import { ReportsDisplaySection } from "./reports-display-section";
import { PrivacySiteSection } from "./privacy-site-section";
import { LimitsSection } from "./limits-section";

/** Bump this whenever the guide is updated. */
export const GUIDE_LAST_UPDATED = "5 September 2026";

export function OrganiserGuide() {
  return (
    <Accordion className="w-full" collapsible defaultValue="what" type="single">
      <OverviewSection />
      <WalksSection />
      <RoutesSection />
      <ProgressClockInSection />
      <MembersSection />
      <HomepageNoticesSection />
      <ReportsDisplaySection />
      <PrivacySiteSection />
      <LimitsSection />
    </Accordion>
  );
}
