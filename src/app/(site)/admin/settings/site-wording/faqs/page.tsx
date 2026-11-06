import { redirect } from "next/navigation";

export const instant = false;

export default function FaqHeadingSettingsRedirect() {
  redirect("/admin/settings/page-designs");
}
