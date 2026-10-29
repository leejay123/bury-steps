"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SIDEBAR_ICONS, type SidebarGroup } from "./sidebar-nav";

/*
 * Efferd's app shell 2 sidebar menu (their classes, from the shadcn sidebar it is
 * built on), in the site's own colours. Folded (html[data-docs-sidebar="collapsed"])
 * it keeps only the icons; shadcnio.css does that, so it is right before the first paint.
 */
const GROUP = "relative flex w-full min-w-0 flex-col p-2";
const GROUP_LABEL =
  "flex h-8 shrink-0 items-center rounded-md px-2 font-medium text-muted-foreground text-xs transition-[margin,opacity] duration-200 ease-linear";
const BUTTON =
  "flex h-8 w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden transition-[width,height,padding] hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring [&>svg]:size-4 [&>svg]:shrink-0 [&>span]:truncate";

function isCurrent(path: string, href: string) {
  if (href === "/" || href === "/overview") return path === href;
  return path === href || path.startsWith(`${href}/`);
}

export function EfferdNav({ groups, onNavigate }: { groups: SidebarGroup[]; onNavigate?: () => void }) {
  const path = usePathname() ?? "";
  return (
    <nav aria-label="Dashboard" className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain" data-slot="efferd-nav">
      {groups.map((group) => (
        <div className={GROUP} key={group.title}>
          <p className={GROUP_LABEL} data-efferd-label="">
            {group.title}
          </p>
          <ul className="flex w-full min-w-0 flex-col gap-1">
            {group.links.map((link) => {
              const Icon = SIDEBAR_ICONS[link.icon];
              const current = isCurrent(path, link.href);
              return (
                <li className="relative" key={link.href}>
                  <Link
                    aria-current={current ? "page" : undefined}
                    className={`${BUTTON} ${current ? "bg-muted font-medium text-foreground" : "text-foreground/75"}`}
                    data-efferd-button=""
                    href={link.href}
                    onClick={onNavigate}
                    title={link.label}
                  >
                    <Icon aria-hidden />
                    <span>{link.label}</span>
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
