import { requireAdmin } from "@/lib/auth";
import { SettingsPage } from "../settings-page";
import { ClearCacheForm } from "./cache-form";

export const dynamic = "force-dynamic";

export default async function CacheSettingsPage() {
  await requireAdmin();

  return (
    <SettingsPage
      description="Refresh the public homepage if it still shows old photos, quotes, or FAQs."
      title="Site cache"
    >
      <ClearCacheForm />
    </SettingsPage>
  );
}
