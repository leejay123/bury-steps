import { redirect } from "next/navigation";

export const instant = false;

export default function FaqsSettingsRedirect() {
  redirect("/admin/settings/page-designs");
}
