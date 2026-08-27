import { redirect } from "next/navigation";

export default function AppearanceRedirect() {
  redirect("/admin/settings/display");
}
