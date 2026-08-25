import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";

export default async function AdminHomepageRedirect() {
  await requireAdmin();
  redirect("/admin/settings");
}
