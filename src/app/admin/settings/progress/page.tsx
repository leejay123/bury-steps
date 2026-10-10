import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { PRIVATE_SAVED_COPY } from "@/lib/private-saved-copy";
import { requirePermission } from "@/lib/auth";
import { getMonthlyClockInGoal } from "@/lib/walk-progress";
import { SettingsPage } from "../settings-page";
import { SettingsMask } from "../settings-mask";
import { PlaceholderPreview } from "@/components/placeholder-preview";
import { ProgressSettingsForm } from "./progress-form";



/** Fetched ahead (from the menu, the Settings table, or its tabs), so it opens with its settings there. */
export const prefetch = "partial";

export default function ProgressSettingsPage() {
  // Title and description are part of the ready-made page; the settings
  // themselves (and the access check) fill in just after.
  return (
    <SettingsPage
      description="Set an optional group clock-in goal for the month. Members see it on Progress. Leave it blank if you do not want a together target."
      title="Progress"
    >
      <Suspense fallback={<ProgressSettingsFallback />}>
        <PlaceholderPreview fallback={<ProgressSettingsFallback />}>
          <ProgressSettingsPageContent />
        </PlaceholderPreview>
      </Suspense>
    </SettingsPage>
  );
}

async function ProgressSettingsPageContent() {
  // A private saved copy (this browser only, five minutes), so the page
  // can be fetched ahead with its settings already in it.
  "use cache: private";
  cacheLife(PRIVATE_SAVED_COPY);
  await requirePermission("permProgress");
  const monthlyClockInGoal = await getMonthlyClockInGoal();

  return (
    <>
      <ProgressSettingsForm monthlyClockInGoal={monthlyClockInGoal} />
    </>
  );
}

/** While the goal loads: the real form, its value greyed (SettingsMask). */
function ProgressSettingsFallback() {
  return (
    <SettingsMask>
      <ProgressSettingsForm monthlyClockInGoal={null} />
    </SettingsMask>
  );
}
