import { Suspense } from "react";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SITE_SETTING_ID } from "@/lib/theme";
import { DEFAULT_CANCELLED_WALK_RETENTION_DAYS } from "@/lib/walk-retention";
import { SettingsContentSkeleton, SettingsPage, SettingsSectionGroup } from "../settings-page";
import { AccidentReportRetentionSettings, CancelledWalkRetentionSettings } from "./retention-settings";



export default function RetentionSettingsPage() {
  // Title and description are part of the ready-made page; the settings
  // themselves (and the access check) fill in just after.
  return (
    <SettingsPage
      description="How long cancelled walks and accident reports are kept before they're deleted automatically. To keep a particular walk or report for good, flag it on that walk or report itself."
      title="Data retention"
    >
      <Suspense fallback={<SettingsContentSkeleton />}>
        <RetentionSettingsPageContent />
      </Suspense>
    </SettingsPage>
  );
}

async function RetentionSettingsPageContent() {
  await requirePermission("permCacheReset");
  const settings = await prisma.siteSetting.findUnique({
    where: { id: SITE_SETTING_ID },
    select: { cancelledWalkRetentionDays: true, accidentReportRetentionDays: true },
  });

  return (
    <>
      <SettingsSectionGroup title="Automatic deletion">
        <CancelledWalkRetentionSettings
          cancelledWalkRetentionDays={
            settings ? settings.cancelledWalkRetentionDays : DEFAULT_CANCELLED_WALK_RETENTION_DAYS
          }
        />
        <AccidentReportRetentionSettings
          accidentReportRetentionDays={settings ? settings.accidentReportRetentionDays : null}
        />
      </SettingsSectionGroup>
    </>
  );
}
