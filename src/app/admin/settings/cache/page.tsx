import { redirect } from "next/navigation";

/** Refresh the homepage was removed from Settings. Keep this URL so old
 * bookmarks land on the Settings home instead of a missing page. */
export default function CacheSettingsPage() {
  redirect("/admin/settings");
}
