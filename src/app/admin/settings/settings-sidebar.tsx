"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  Archive,
  Bell,
  ChevronRight,
  ClipboardList,
  BookOpen,
  HelpCircle,
  ImageIcon,
  LayoutGrid,
  Mail,
  Quote,
  RefreshCw,
  SlidersHorizontal,
  Text,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { unlockIdleDocument } from "@/components/overlay-root";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

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

function NavItemWithChildren({ item, pathname }: { item: NavItem & { children: NavChild[] }; pathname: string }) {
  const inSection = pathname.startsWith(sectionPrefix(item.href));
  // Defaults to "open on its own pages, closed elsewhere"; a manual click
  // can override that default in either direction for the rest of this visit.
  const [manualOpen, setManualOpen] = useState<boolean | null>(null);
  const open = manualOpen ?? inSection;

  return (
    <Collapsible asChild defaultOpen={inSection} onOpenChange={setManualOpen} open={open}>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={inSection}>
          <Link href={item.href} onClick={() => unlockIdleDocument()}>
            <item.icon aria-hidden />
            {item.label}
          </Link>
        </SidebarMenuButton>
        <CollapsibleTrigger asChild>
          <button
            aria-label={open ? `Collapse ${item.label}` : `Expand ${item.label}`}
            className="absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-hidden transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[state=open]:rotate-90"
            type="button"
          >
            <ChevronRight aria-hidden className="size-4" />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.children.map((child) => (
              <SidebarMenuSubItem key={child.href}>
                <SidebarMenuSubButton asChild isActive={pathname === child.href}>
                  <Link href={child.href} onClick={() => unlockIdleDocument()}>
                    {child.label}
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

/**
 * The Settings area's nav, built on shadcn's Sidebar primitives — desktop
 * gets the persistent panel, a phone automatically gets the same tree as a
 * slide-in sheet (see SidebarProvider/Sidebar's own built-in behaviour),
 * both opened from the SettingsSidebarTrigger in ../settings-page.tsx. Only
 * the owner ever reaches anything under /admin/settings (every settings-area
 * permission is owner-only — see @/lib/organiser-permissions), so unlike
 * the top nav this never needs to hide an item per viewer.
 */
export function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="font-semibold">
              <Link href="/admin/settings" onClick={() => unlockIdleDocument()}>
                Settings
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) =>
                  item.children ? (
                    <NavItemWithChildren item={item as NavItem & { children: NavChild[] }} key={item.href} pathname={pathname} />
                  ) : (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        className={cn(item.danger && "text-destructive hover:text-destructive")}
                        isActive={pathname === item.href}
                      >
                        <Link href={item.href} onClick={() => unlockIdleDocument()}>
                          <item.icon aria-hidden className={cn(item.danger && "text-destructive")} />
                          {item.label}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ),
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
