"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  Archive,
  Bell,
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

type NavItem = { href: string; label: string; icon: LucideIcon; danger?: boolean };
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
      { href: "/admin/settings/site-wording", label: "Site wording", icon: Text },
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

/**
 * Persistent left nav for the whole Settings area (src/app/admin/settings/
 * layout.tsx) — every settings page lives under one shared shell instead
 * of each page starting from a blank slate, matching the top site nav's
 * own always-visible-while-you're-in-this-area pattern. Only the owner
 * ever reaches anything under /admin/settings (every settings-area
 * permission is owner-only — see @/lib/organiser-permissions), so unlike
 * the top nav this never needs to hide an item per viewer.
 */
export function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 flex-col gap-5 border-r bg-muted/30 px-3 py-5 md:flex">
      <Link
        className="flex items-center gap-2 rounded-md px-2 py-1 text-sm font-semibold tracking-tight"
        href="/admin/settings"
        onClick={() => unlockIdleDocument()}
      >
        Settings
      </Link>
      <nav className="flex flex-col gap-4 overflow-y-auto">
        {GROUPS.map((group) => (
          <div className="flex flex-col gap-0.5" key={group.label}>
            <p className="px-2.5 py-1 text-[0.65rem] font-semibold tracking-wider text-muted-foreground uppercase">
              {group.label}
            </p>
            {group.items.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-foreground transition-colors",
                    active ? "bg-accent font-medium" : "hover:bg-accent/60",
                    item.danger && "text-destructive",
                  )}
                  href={item.href}
                  key={item.href}
                  onClick={() => unlockIdleDocument()}
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
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
