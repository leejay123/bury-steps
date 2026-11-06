import { redirect } from "next/navigation";

export const instant = false;

export default function TestimonialsHeadingSettingsRedirect() {
  redirect("/admin/settings/page-designs");
}
