import { requireAdmin } from "@/lib/auth";
import { getAccidentReportRetentionDays, getCancelledWalkRetentionDays } from "@/lib/walk-retention";
import { AdminPageIntro } from "../admin-page-intro";
import { GUIDE_LAST_UPDATED, OrganiserGuide } from "./guide-content";
import { FullWidthDivider } from "@/components/full-width-divider";

export const dynamic = "force-dynamic";

export default async function OrganiserGuidePage() {
  await requireAdmin();
  const [cancelledWalkRetentionDays, accidentReportRetentionDays] = await Promise.all([
    getCancelledWalkRetentionDays(),
    getAccidentReportRetentionDays(),
  ]);

  return (
    <div className="flex flex-col">
      <div className="relative px-4 py-6 md:px-6">
        <AdminPageIntro
          description={`How this website works, and how to run walks, members, and the homepage. Last updated ${GUIDE_LAST_UPDATED}.`}
          title="Guide"
        />
        <FullWidthDivider position="bottom" />
      </div>
      <OrganiserGuide
        accidentReportRetentionDays={accidentReportRetentionDays}
        cancelledWalkRetentionDays={cancelledWalkRetentionDays}
      />
    </div>
  );
}
