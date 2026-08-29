import { requireAdmin } from "@/lib/auth";
import { getMonthlyClockInGoal } from "@/lib/walk-progress";
import { SettingsPage } from "../settings-page";
import { ProgressSettingsForm } from "./progress-form";

export const dynamic = "force-dynamic";

export default async function ProgressSettingsPage() {
  await requireAdmin();
  const monthlyClockInGoal = await getMonthlyClockInGoal();

  return (
    <SettingsPage
      description="Set an optional group clock-in goal for the month. Members see it on Progress. Leave it blank if you do not want a together target."
      title="Progress"
    >
      <ProgressSettingsForm monthlyClockInGoal={monthlyClockInGoal} />
    </SettingsPage>
  );
}
