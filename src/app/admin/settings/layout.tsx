import { requireAnySettingsPermission } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Every page under /admin/settings — the card-table home and each page it
 * links to. Navigation between them is the table itself plus each page's
 * "← All settings" link (see SettingsPage), not a sidebar. Gates on the
 * same "any settings permission" check every settings page relies on, so
 * a viewer with none of them 404s before anything renders.
 */
export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  await requireAnySettingsPermission();
  return children;
}
