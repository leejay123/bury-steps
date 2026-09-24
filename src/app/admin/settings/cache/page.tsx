import { requirePermission } from "@/lib/auth";
import { SettingsPage } from "../settings-page";
import { ClearCacheForm } from "./cache-form";

export const dynamic = "force-dynamic";

export default async function CacheSettingsPage() {
  await requirePermission("permCacheReset");

  return (
    <SettingsPage
      description="Use this if the public homepage still shows old photos, quotes or questions after you've saved changes."
      title="Refresh the homepage"
    >
      <ClearCacheForm />
    </SettingsPage>
  );
}
