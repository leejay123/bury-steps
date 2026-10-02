import { requirePermission } from "@/lib/auth";
import { getMonthlyClockInGoal } from "@/lib/walk-progress";
import { SettingsPage } from "../settings-page";
import { ProgressSettingsForm } from "./progress-form";


// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;


export default async function ProgressSettingsPage() {
  await requirePermission("permProgress");
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
