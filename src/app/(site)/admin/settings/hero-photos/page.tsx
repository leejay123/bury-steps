import { redirect } from "next/navigation";

export const instant = false;

export default function HeroPhotosSettingsRedirect() {
  redirect("/admin/settings/page-designs");
}
