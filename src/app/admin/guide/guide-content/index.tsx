import { Accordion } from "@/components/ui/accordion";
import { OverviewSection } from "./overview-section";
import { WalksSection } from "./walks-section";
import { ProgressClockInSection } from "./progress-clockin-section";
import { MembersSection, MessagesSection } from "./members-section";
import { HomepageNoticesSection } from "./homepage-notices-section";
import { ReportsDisplaySection } from "./reports-display-section";
import { PrivacySiteSection } from "./privacy-site-section";
import { LimitsSection } from "./limits-section";

/** Bump this whenever the guide is updated. */
export const GUIDE_LAST_UPDATED = "8 October 2026";

export function OrganiserGuide({
  accidentReportRetentionDays,
  cancelledWalkRetentionDays,
  isOwner,
}: {
  accidentReportRetentionDays: number | null;
  cancelledWalkRetentionDays: number | null;
  /** Members and Messages are owner-only pages, so plain organisers don't get
   * their sections (the links in them would only lead to "page not found"). */
  isOwner: boolean;
}) {
  return (
    <Accordion className="w-full" collapsible defaultValue="what" type="single">
      <OverviewSection cancelledWalkRetentionDays={cancelledWalkRetentionDays} />
      <WalksSection cancelledWalkRetentionDays={cancelledWalkRetentionDays} />
      <ProgressClockInSection />
      {isOwner ? <MembersSection /> : null}
      {isOwner ? <MessagesSection /> : null}
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
