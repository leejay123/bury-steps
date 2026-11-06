import { redirect } from "next/navigation";

export const instant = false;

export default function AboutListsSettingsRedirect() {
  redirect("/admin/settings/page-designs");
}
