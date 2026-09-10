import { Accordion } from "@/components/ui/accordion";
import { OverviewSection } from "./overview-section";
import { WalksSection } from "./walks-section";
import { ProgressClockInSection } from "./progress-clockin-section";
import { MembersSection } from "./members-section";
import { HomepageNoticesSection } from "./homepage-notices-section";
import { ReportsDisplaySection } from "./reports-display-section";
import { PrivacySiteSection } from "./privacy-site-section";
import { LimitsSection } from "./limits-section";

/** Bump this whenever the guide is updated. */
export const GUIDE_LAST_UPDATED = "5 September 2026";

export function OrganiserGuide({
  accidentReportRetentionDays,
  cancelledWalkRetentionDays,
}: {
  accidentReportRetentionDays: number | null;
  cancelledWalkRetentionDays: number | null;
}) {
  return (
    <Accordion className="w-full" collapsible defaultValue="what" type="single">
      <OverviewSection cancelledWalkRetentionDays={cancelledWalkRetentionDays} />
      <WalksSection cancelledWalkRetentionDays={cancelledWalkRetentionDays} />
      <ProgressClockInSection />
      <MembersSection />
      <HomepageNoticesSection />
      <ReportsDisplaySection />
      <PrivacySiteSection />
      <LimitsSection
        accidentReportRetentionDays={accidentReportRetentionDays}
        cancelledWalkRetentionDays={cancelledWalkRetentionDays}
      />
    </Accordion>
  );
}
