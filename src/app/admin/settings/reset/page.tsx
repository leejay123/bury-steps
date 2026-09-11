import { requirePermission } from "@/lib/auth";
import { SettingsPage } from "../settings-page";
import { ResetSiteForm } from "./reset-form";

export const dynamic = "force-dynamic";

export default async function ResetSiteSettingsPage() {
  await requirePermission("permSettings");

  return (
    <SettingsPage
      description="Wipe walks, members, and homepage edits, and put the starter content back. You stay the organiser."
      title="Reset the site"
    >
      <ResetSiteForm />
    </SettingsPage>
  );
}
