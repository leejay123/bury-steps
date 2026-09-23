"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  Archive,
  Bell,
  ChevronDown,
  ClipboardList,
  BookOpen,
  HelpCircle,
  ImageIcon,
  LayoutGrid,
  Mail,
  Menu,
  PanelLeft,
  Quote,
  RefreshCw,
  SlidersHorizontal,
  Text,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { unlockIdleDocument } from "@/components/overlay-root";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";

type NavChild = { href: string; label: string };
type NavItem = { href: string; label: string; icon: LucideIcon; danger?: boolean; children?: NavChild[] };
type NavGroup = { label: string; items: NavItem[] };

const GROUPS: NavGroup[] = [
  {
    label: "Homepage content",
    items: [
      { href: "/admin/settings/hero-photos", label: "Hero photos", icon: ImageIcon },
      { href: "/admin/settings/testimonials", label: "Testimonials", icon: Quote },
      { href: "/admin/settings/faqs", label: "FAQs", icon: HelpCircle },
      { href: "/admin/settings/branding", label: "Branding", icon: LayoutGrid },
      { href: "/admin/settings/homepage-layout", label: "Homepage layout", icon: SlidersHorizontal },
      {
        href: "/admin/settings/site-wording/how-this-started",
        label: "Site wording",
        icon: Text,
        children: [
          { href: "/admin/settings/site-wording/how-this-started", label: "How this started" },
          { href: "/admin/settings/site-wording/about-lists", label: "About lists" },
          { href: "/admin/settings/site-wording/testimonials", label: "Testimonials heading" },
          { href: "/admin/settings/site-wording/faqs", label: "FAQ heading" },
          { href: "/admin/settings/site-wording/walk-page-cards", label: "Walk page cards" },
        ],
      },
    ],
  },
  {
    label: "Communication",
    items: [
      { href: "/admin/settings/notices", label: "Notices", icon: Bell },
      { href: "/admin/settings/emails", label: "Emails", icon: Mail },
      { href: "/admin/settings/subscribers", label: "Subscribers", icon: Users },
    ],
  },
  {
    label: "Site behaviour",
    items: [{ href: "/admin/settings/behaviour", label: "Site behaviour", icon: SlidersHorizontal }],
  },
  {
    label: "Maintenance",
    items: [
      { href: "/admin/settings/retention", label: "Retention", icon: Archive },
      { href: "/admin/settings/cache", label: "Site cache", icon: RefreshCw },
      { href: "/admin/settings/reset", label: "Reset the site", icon: AlertTriangle, danger: true },
    ],
  },
  {
    label: "More",
    items: [
      { href: "/admin/reports", label: "Accident reports", icon: ClipboardList },
      { href: "/admin/guide", label: "Guide", icon: BookOpen },
    ],
  },
];

/** The part of a parent item's own href before its last segment — every one
 * of its children lives under this prefix too, so it doubles as "are we
 * anywhere in this section" for both the active check and the auto-expand
 * default below. */
function sectionPrefix(href: string) {
  return href.slice(0, href.lastIndexOf("/"));
}

/** The nav tree shared by the desktop sidebar and the mobile drawer below —
 * same groups, same active/expand logic, so the two never drift apart. */
function SettingsNavTree({ onNavigate, pathname }: { onNavigate?: () => void; pathname: string }) {
  // Whether each item-with-children is expanded. Defaults to "open on its
  // own pages, closed elsewhere"; a manual click can override that default
  // in either direction for the rest of this visit.
  const [expandedOverrides, setExpandedOverrides] = useState<Record<string, boolean>>({});

  function handleNavigate() {
    unlockIdleDocument();
    onNavigate?.();
  }

  return (
    <nav className="flex flex-col gap-4">
      {GROUPS.map((group) => (
        <div className="flex flex-col gap-0.5" key={group.label}>
          <p className="px-2.5 py-1 text-[0.65rem] font-semibold tracking-wider text-muted-foreground uppercase">
            {group.label}
          </p>
          {group.items.map((item) => {
            const inSection = item.children ? pathname.startsWith(sectionPrefix(item.href)) : false;
            // Exact match only, even for a parent with children — using
            // `inSection` here highlighted "Site wording" itself for every
            // one of its 5 pages, showing two rows "active" (it and
            // whichever child) at once. Real shadcn sidebars only ever
            // highlight the one row you're actually on.
            const active = pathname === item.href;
            const expanded = item.children ? (expandedOverrides[item.href] ?? inSection) : false;
            return (
              <div key={item.href}>
                <div className="flex items-center gap-0.5">
                  <Link
                    className={cn(
                      "flex flex-1 items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-foreground transition-colors",
                      active ? "bg-accent font-medium" : "hover:bg-accent/60",
                      item.danger && "text-destructive",
                    )}
                    href={item.href}
                    onClick={handleNavigate}
                  >
                    <item.icon
                      aria-hidden
                      className={cn(
                        "size-4 shrink-0",
                        item.danger ? "text-destructive" : "text-muted-foreground",
                        active && !item.danger && "text-foreground",
                      )}
                    />
                    {item.label}
                  </Link>
                  {item.children ? (
                    <button
                      aria-expanded={expanded}
                      aria-label={expanded ? `Collapse ${item.label}` : `Expand ${item.label}`}
                      className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
                      onClick={() =>
                        setExpandedOverrides((prev) => ({ ...prev, [item.href]: !expanded }))
                      }
                      type="button"
                    >
                      <ChevronDown
                        aria-hidden
                        className={cn("size-3.5 transition-transform", expanded && "rotate-180")}
                      />
                    </button>
                  ) : null}
                </div>
                {item.children && expanded ? (
                  <div className="mt-0.5 ml-[0.9375rem] flex flex-col gap-0.5 border-l pl-3">
                    {item.children.map((child) => {
                      const childActive = pathname === child.href;
                      return (
                        <Link
                          className={cn(
                            "rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors",
                            childActive ? "bg-accent font-medium text-foreground" : "hover:bg-accent/60",
                          )}
                          href={child.href}
                          key={child.href}
                          onClick={handleNavigate}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

/**
 * Persistent left nav for the whole Settings area (src/app/admin/settings/
 * layout.tsx) — every settings page lives under one shared shell instead
 * of each page starting from a blank slate, matching the top site nav's
 * own always-visible-while-you're-in-this-area pattern. Only the owner
 * ever reaches anything under /admin/settings (every settings-area
 * permission is owner-only — see @/lib/organiser-permissions), so unlike
 * the top nav this never needs to hide an item per viewer.
 *
 * `sticky top-14`: stays in view as the page content scrolls, pinned just
 * below the site's own sticky header (h-14). Its own scrollbar is styled
 * thin rather than the browser's default — a full-width scrollbar looked
 * heavy next to how narrow this column is.
 *
 * `z-[65]`, above every Drawer/Dialog/AlertDialog's shared overlay
 * (z-[60], see those components) — without this, opening any drawer on a
 * settings page (editing an FAQ, a notice, anything) blurred and dimmed
 * the sidebar along with the rest of the page, same as page content. Page
 * content dimming that way is the point (draw focus to the drawer); this
 * persistent nav isn't page content, so it stays sharp and usable instead.
 * That full-viewport blur is also genuinely expensive to paint — layering
 * it every open/close over this sticky, independently-scrolling column was
 * very likely what made opening/closing a drawer feel laggy specifically
 * on settings pages.
 *
 * Collapses to a slim rail (just the toggle button) on desktop — local
 * state, not persisted: reopens full-width on your next visit rather than
 * remembering a collapsed choice, which is fine for a settings area only
 * the owner ever opens.
 */
export function SettingsSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "sticky top-14 z-[65] hidden h-[calc(100dvh-3.5rem)] shrink-0 flex-col gap-5 overflow-y-auto border-r bg-muted/30 py-5 md:flex",
        collapsed ? "w-12 px-2" : "w-56 px-3",
        "[scrollbar-width:thin] [scrollbar-color:var(--border)_transparent]",
        "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent",
      )}
    >
      <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between gap-1")}>
        {collapsed ? null : (
          <Link
            className="flex items-center gap-2 rounded-md px-2 py-1 text-sm font-semibold tracking-tight"
            href="/admin/settings"
            onClick={() => unlockIdleDocument()}
          >
            Settings
          </Link>
        )}
        <button
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
          onClick={() => setCollapsed((current) => !current)}
          type="button"
        >
          <PanelLeft aria-hidden className="size-4" />
        </button>
      </div>
      {collapsed ? null : <SettingsNavTree pathname={pathname} />}
    </aside>
  );
}

/** Finds the current page's label (with its parent, for a nested page) so
 * the mobile trigger button can show where you are, not just "Menu". */
function currentPageLabel(pathname: string): string | null {
  for (const group of GROUPS) {
    for (const item of group.items) {
      const child = item.children?.find((c) => c.href === pathname);
      if (child) return `${item.label} · ${child.label}`;
      if (item.href === pathname) return item.label;
    }
  }
  return null;
}

/**
 * The sidebar above is desktop-only (`md:flex`) — on a phone there was no
 * way to move between settings pages at all once you'd landed on one,
 * short of going back to the top nav's Settings dropdown each time. This is
 * that same nav tree, opened from a full-width button as a bottom sheet.
 */
export function SettingsMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="sticky top-14 z-10 border-b bg-background px-4 py-2 md:hidden">
      <Drawer onOpenChange={setOpen} open={open}>
        <DrawerTrigger asChild>
          <Button className="w-full justify-between font-normal" size="sm" type="button" variant="outline">
            <span className="flex min-w-0 items-center gap-2">
              <Menu aria-hidden className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{currentPageLabel(pathname) ?? "Browse settings"}</span>
            </span>
            <ChevronDown aria-hidden className="size-4 shrink-0 text-muted-foreground" />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="max-h-[85dvh]">
          <DrawerHeader className="shrink-0">
            <DrawerTitle>Settings</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-6">
            <SettingsNavTree onNavigate={() => setOpen(false)} pathname={pathname} />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
