import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth";

export default async function AdminHomepageRedirect() {
  await requirePermission("permSettings");
  redirect("/admin/settings");
}
