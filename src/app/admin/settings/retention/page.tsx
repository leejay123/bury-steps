import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SITE_SETTING_ID } from "@/lib/theme";
import { DEFAULT_CANCELLED_WALK_RETENTION_DAYS } from "@/lib/walk-retention";
import { SettingsPage, SettingsSectionGroup } from "../settings-page";
import { AccidentReportRetentionSettings, CancelledWalkRetentionSettings } from "./retention-settings";

export const dynamic = "force-dynamic";

export default async function RetentionSettingsPage() {
  await requirePermission("permCacheReset");
  const settings = await prisma.siteSetting.findUnique({
    where: { id: SITE_SETTING_ID },
    select: { cancelledWalkRetentionDays: true, accidentReportRetentionDays: true },
  });

  return (
    <SettingsPage
      description="How long cancelled walks and accident reports are kept before they're deleted automatically. To keep a particular walk or report for good, flag it on that walk or report itself."
      title="Data retention"
    >
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
    </SettingsPage>
  );
}
