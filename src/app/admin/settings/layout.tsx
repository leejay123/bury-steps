import { requireAnySettingsPermission } from "@/lib/auth";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SettingsSidebar } from "./settings-sidebar";

export const dynamic = "force-dynamic";

/**
 * Persistent shell for every page under /admin/settings, built on shadcn's
 * Sidebar primitives (SidebarProvider/SidebarInset): a left panel that never
 * goes away as you move between pages, instead of each page starting from a
 * blank slate. On a phone the same panel opens as a slide-in sheet — no
 * separate mobile nav to keep in sync — and the toggle button that opens
 * either (SettingsSidebarTrigger) lives in ./settings-page.tsx's shared
 * header so every page carries it automatically.
 *
 * No `defaultOpen` read from the "sidebar_state" cookie the way shadcn's own
 * docs show — SidebarProvider still writes that cookie on every toggle, it
 * is just not read back here, so the sidebar starts open on a fresh page
 * load rather than remembering a collapsed choice across visits. Not worth
 * the extra server-side plumbing for a settings area only the owner opens.
 *
 * Gates on the same "any settings permission" check every settings page
 * already relied on individually, so a viewer with none of them still
 * 404s before the sidebar itself ever renders.
 */
export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  await requireAnySettingsPermission();

  return (
    <SidebarProvider className="min-h-0">
      <SettingsSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
