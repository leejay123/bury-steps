"use client";

import { Suspense } from "react";
import { IntentLink as Link } from "@/components/intent-link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { FoldedTip } from "./folded-tip";
import { SIDEBAR_ICONS, type SidebarGroup } from "./sidebar-nav";

/*
 * Efferd's app shell 2 sidebar menu (their classes, from the shadcn sidebar it is
 * built on), in the site's own colours. Folded (html[data-docs-sidebar="collapsed"])
 * it keeps only the icons; shadcnio.css does that, so it is right before the first paint.
 */
const GROUP = "relative flex w-full min-w-0 flex-col p-2";
const BUTTON =
  "flex h-8 w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden transition-[width,height,padding] hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring [&>svg]:size-4 [&>svg]:shrink-0 [&>span]:truncate";

function isCurrent(path: string, href: string) {
  if (href === "/" || href === "/overview") return path === href;
  return path === href || path.startsWith(`${href}/`);
}

type NavProps = { groups: SidebarGroup[]; onNavigate?: () => void };

/**
 * The menu, with the current page marked. On pages whose address has a part only
 * known when visited (a member's own page, say), the address can't be read while
 * the ready-made page is built, so the same menu without a mark stands in until it
 * can (Next.js's advice for sidebars: docs, usePathname, "cacheComponents").
 */
export function EfferdNav(props: NavProps) {
  return (
    <Suspense fallback={<NavList {...props} path="" />}>
      <CurrentNav {...props} />
    </Suspense>
  );
}

function CurrentNav(props: NavProps) {
  return <NavList {...props} path={usePathname() ?? ""} />;
}

function NavList({ groups, onNavigate, path }: NavProps & { path: string }) {
  return (
    <nav aria-label="Dashboard" className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain" data-slot="efferd-nav">
      {groups.map((group, index) => (
        // No visible group names (Dashboard, Organisers, Settings): a line between groups
        // instead. The name stays for screen readers.
        <div className={cn(GROUP, index > 0 && "border-t")} data-sb-only={group.only} key={group.title}>
          <p className="sr-only">{group.title}</p>
          <ul className="flex w-full min-w-0 flex-col gap-1">
            {group.links.map((link) => {
              const Icon = SIDEBAR_ICONS[link.icon];
              const current = isCurrent(path, link.href);
              return (
                <li className="relative" data-sb-only={link.only} key={`${link.href}-${link.only ?? ""}`}>
                  <FoldedTip label={link.label}>
                    <Link
                      aria-current={current ? "page" : undefined}
                      aria-label={link.label}
                      className={`${BUTTON} ${current ? "bg-muted font-medium text-foreground" : "text-foreground/75"}`}
                      data-efferd-button=""
                      href={link.href}
                      onClick={onNavigate}
                    >
                      <Icon aria-hidden />
                      <span>{link.label}</span>
                    </Link>
                  </FoldedTip>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

