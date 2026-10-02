import { requirePermission } from "@/lib/auth";
import { getSiteTheme } from "@/lib/site-theme";
import { SettingsPage } from "../settings-page";
import { WalkEssentialsEditor } from "./walk-essentials-editor";


// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;


export default async function WalkEssentialsSettingsPage() {
  await requirePermission("permWalksEdit");
  const theme = await getSiteTheme();

  return (
    <SettingsPage
      description="The tick-box list under Essentials when you create or edit a walk. Rename items, pick their icons, add your own or remove ones you don't use. Changes show on every walk straight away."
      title="Walk essentials"
    >
      <WalkEssentialsEditor items={theme.walkEssentials} />
    </SettingsPage>
  );
}
