import { requirePermission } from "@/lib/auth";
import { SettingsPage } from "../settings-page";
import { ResetSiteForm } from "./reset-form";


// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;


export default async function ResetSiteSettingsPage() {
  await requirePermission("permCacheReset");

  return (
    <SettingsPage
      description="Wipe walks, members, messages, subscribers, and homepage edits, and put the starter content back. You stay the organiser."
      title="Reset the site"
    >
      <ResetSiteForm />
    </SettingsPage>
  );
}
