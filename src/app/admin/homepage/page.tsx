import { redirect } from "next/navigation";
import { requireAnySettingsPermission } from "@/lib/auth";

export default async function AdminHomepageRedirect() {
  await requireAnySettingsPermission();
  redirect("/admin/settings");
}
