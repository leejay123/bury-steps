import { redirect } from "next/navigation";

export const instant = false;

export default function HowThisStartedSettingsRedirect() {
  redirect("/admin/settings/page-designs");
}
