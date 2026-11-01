"use client";

import { Suspense, useState } from "react";
import { IntentLink as Link } from "@/components/intent-link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
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
      {groups.map((group) => (
        <div className={GROUP} data-sb-only={group.only} key={group.title}>
          <p className={GROUP_LABEL} data-efferd-label="">
            {group.title}
          </p>
          <ul className="flex w-full min-w-0 flex-col gap-1">
            {group.links.map((link) => {
              const Icon = SIDEBAR_ICONS[link.icon];
              const current = isCurrent(path, link.href);
              if (link.children?.length)
                return <SubMenu current={current} key={`${link.href}-sub`} link={link} onNavigate={onNavigate} path={path} />;
              return (
                <li className="relative" data-sb-only={link.only} key={`${link.href}-${link.only ?? ""}`}>
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

/** A row whose pages open beneath it (Efferd's collapsible sub-menu, with its line down the side). */
function SubMenu({
  link,
  path,
  current,
  onNavigate,
}: {
  link: SidebarGroup["links"][number];
  path: string;
  current: boolean;
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState(current);
  const [wasCurrent, setWasCurrent] = useState(current);
  // Arriving on one of its pages opens it.
  if (current !== wasCurrent) {
    setWasCurrent(current);
    if (current) setOpen(true);
  }
  const router = useRouter();
  const Icon = SIDEBAR_ICONS[link.icon];
  // Folded to icons there's nothing to open, so the icon goes straight to the page.
  const toggle = () => {
    const folded =
      document.documentElement.getAttribute("data-docs-sidebar") === "collapsed" &&
      window.matchMedia("(min-width: 64rem)").matches;
    if (folded) {
      onNavigate?.();
      router.push(link.href);
    } else setOpen((was) => !was);
  };
  return (
    <li className="relative" data-sb-only={link.only}>
      <button
        aria-expanded={open}
        className={`${BUTTON} ${current ? "font-medium text-foreground" : "text-foreground/75"}`}
        data-efferd-button=""
        onClick={toggle}
        title={link.label}
        type="button"
      >
        <Icon aria-hidden />
        <span>{link.label}</span>
        <ChevronRight aria-hidden className={`ml-auto transition-transform duration-200 ${open ? "rotate-90" : ""}`} />
      </button>
      {open ? (
        <ul className="mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l px-2.5 py-0.5" data-efferd-sub="">
          {link.children!.map((child) => {
            const here = child.href === "/admin/settings" ? path === child.href : isCurrent(path, child.href);
            return (
              <li key={child.href}>
                <Link
                  aria-current={here ? "page" : undefined}
                  className={`flex h-7 min-w-0 items-center gap-2 overflow-hidden rounded-md px-2 text-sm outline-hidden hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring ${here ? "bg-muted font-medium text-foreground" : "text-foreground/75"}`}
                  href={child.href}
                  onClick={onNavigate}
                >
                  <span className="truncate">{child.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </li>
  );
}
