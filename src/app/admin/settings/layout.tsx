import { requireAnySettingsPermission } from "@/lib/auth";
import { SettingsSidebar } from "./settings-sidebar";

export const dynamic = "force-dynamic";

/**
 * Persistent shell for every page under /admin/settings — a left sidebar
 * (SettingsSidebar) that never goes away as you move between pages,
 * instead of each page starting from a blank slate. Gates on the same
 * "any settings permission" check every settings page already relied on
 * individually, so a viewer with none of them still 404s before the
 * sidebar itself ever renders.
 */
export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  await requireAnySettingsPermission();

  return (
    <div className="flex flex-col md:flex-row">
      <SettingsSidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
