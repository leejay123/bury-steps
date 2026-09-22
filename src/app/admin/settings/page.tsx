import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * The bare /admin/settings URL used to show every settings page again as a
 * big list of rows — redundant now that the sidebar (see ../layout.tsx)
 * lists every page persistently, on every settings page at once. Land on
 * Branding instead: the site's identity (name, logo, tagline) is the most
 * natural "start here" page.
 */
export default function AdminSettingsPage() {
  redirect("/admin/settings/branding");
}
