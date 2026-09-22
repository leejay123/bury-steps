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
      description="Automatic deletion of old cancelled walks and accident reports. Flag an individual walk or report to keep it regardless, from that walk or report itself."
      title="Retention"
    >
      <SettingsSectionGroup
        description="How long cancelled walks and accident reports are kept before they're deleted automatically."
        title="Retention"
      >
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
