import { redirect } from "next/navigation";
import { requireAnySettingsPermission } from "@/lib/auth";

// Only ever redirects, so there's nothing to show instantly.
export const instant = false;

export default async function AdminHomepageRedirect() {
  await requireAnySettingsPermission();
  redirect("/admin/settings");
}
