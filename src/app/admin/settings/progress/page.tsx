import { Suspense } from "react";
import { requirePermission } from "@/lib/auth";
import { getMonthlyClockInGoal } from "@/lib/walk-progress";
import { SettingsContentSkeleton, SettingsPage } from "../settings-page";
import { ProgressSettingsForm } from "./progress-form";



export default function ProgressSettingsPage() {
  // Title and description are part of the ready-made page; the settings
  // themselves (and the access check) fill in just after.
  return (
    <SettingsPage
      description="Set an optional group clock-in goal for the month. Members see it on Progress. Leave it blank if you do not want a together target."
      title="Progress"
    >
      <Suspense fallback={<SettingsContentSkeleton />}>
        <ProgressSettingsPageContent />
      </Suspense>
    </SettingsPage>
  );
}

async function ProgressSettingsPageContent() {
  await requirePermission("permProgress");
  const monthlyClockInGoal = await getMonthlyClockInGoal();

  return (
    <>
      <ProgressSettingsForm monthlyClockInGoal={monthlyClockInGoal} />
    </>
  );
}
