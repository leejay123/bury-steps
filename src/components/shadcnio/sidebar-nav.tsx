"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  Calendar,
  ClipboardList,
  History,
  LayoutDashboard,
  Mail,
  MailCheck,
  MessageSquare,
  Settings,
  TrendingUp,
  User,
  Users,
} from "lucide-react";

const ICONS = {
  overview: LayoutDashboard,
  walks: Calendar,
  notices: Bell,
  progress: TrendingUp,
  history: History,
  members: Users,
  messages: MessageSquare,
  reports: ClipboardList,
  settings: Settings,
  guide: BookOpen,
  homepage: Building2,
  account: User,
  emails: MailCheck,
  contact: Mail,
  stats: BarChart3,
} as const;

export type SidebarIcon = keyof typeof ICONS;
export type SidebarLink = { href: string; label: string; icon: SidebarIcon; tag?: string };
export type SidebarGroup = { title: string; links: SidebarLink[] };

// shadcn.io's sidebar links, class for class (used with their permission).
const LINK =
  "transition-none relative flex h-8 w-full min-w-0 items-center gap-2.5 px-4 text-sm outline-none focus-visible:bg-foreground/4 focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset [&_svg]:size-4 [&_svg]:shrink-0";
const IDLE = "text-muted-foreground hover:bg-foreground/4 hover:text-foreground";
const ACTIVE =
  "hover:text-foreground bg-foreground/7 font-medium text-foreground before:absolute before:inset-y-0 before:start-0 before:w-0.5 before:bg-foreground hover:bg-foreground/7";
const LABEL = "font-medium font-mono text-muted-foreground text-xs uppercase leading-4 tracking-widest";

function isCurrent(path: string, href: string) {
  if (href === "/dashboard") return path === "/dashboard";
  return path === href || path.startsWith(`${href}/`);
}

/** The sidebar's groups of links, the current page marked as on shadcn.io. */
export function SidebarNav({ groups, onNavigate }: { groups: SidebarGroup[]; onNavigate?: () => void }) {
  const path = usePathname() ?? "";
  return (
    <nav
      aria-label="Dashboard"
      className="scrollbar-none flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain pb-4"
      data-slot="docs-sidebar-nav"
    >
      {groups.map((group) => (
        <div className="flex flex-col" key={group.title}>
          <p className={`${LABEL} px-4 pt-4 pb-1.5`}>{group.title}</p>
          <ul className="flex flex-col">
            {group.links.map((link) => {
              const Icon = ICONS[link.icon];
              const current = isCurrent(path, link.href);
              return (
                <li key={link.href}>
                  <Link
                    aria-current={current ? "page" : undefined}
                    className={`${LINK} ${current ? ACTIVE : IDLE}`}
                    href={link.href}
                    onClick={onNavigate}
                  >
                    <Icon aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{link.label}</span>
                    {link.tag ? <span className={`${LABEL} shrink-0`}>{link.tag}</span> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
