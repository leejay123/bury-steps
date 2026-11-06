import { redirect } from "next/navigation";

export const instant = false;

export default function HomepageLayoutSettingsRedirect() {
  redirect("/admin/settings/page-designs");
}
