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
    // Sidebar's desktop panel is `position: fixed` against the viewport,
    // which is right for shadcn's own assumption that SidebarProvider sits
    // directly under <body> — here it's nested inside the site's own
    // centered, bordered shell (see src/app/layout.tsx), so a plain fixed
    // sidebar pinned itself to the real browser edge instead of that
    // column, floating above the site's own header. `contain: layout`
    // makes this div the containing block for its fixed descendants
    // instead — the sidebar now positions against this box (inside the
    // column, below the header) rather than the viewport. Portaled content
    // (Drawer/Dialog overlays) is unaffected: portals render outside this
    // subtree in the DOM regardless of CSS containment.
    //
    // `overflow-hidden` alongside it: the collapsed (offcanvas) state
    // slides the panel to `left: -16rem` relative to that same containing
    // box — on a screen wider than the site's own max-w-[1200px] column,
    // that has room to bleed into the column's outer margin instead of
    // going fully offscreen, without this to clip it there.
    <div className="overflow-hidden [contain:layout]">
      <SidebarProvider className="min-h-0">
        <SettingsSidebar />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </div>
  );
}
