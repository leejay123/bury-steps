"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { unlockIdleDocument } from "@/components/overlay-root";
import { findSettingsPage } from "@/lib/settings-pages";

/** "← All settings · Homepage" above a settings page's title — the way
 * back to the card table, plus which of its groups this page sits in.
 * Worked out from the URL, so no page has to pass its own group in. */
export function SettingsBackLink() {
  const pathname = usePathname();
  const found = findSettingsPage(pathname);

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
      <Link
        className="inline-flex items-center gap-1.5 font-medium text-muted-foreground hover:text-foreground"
        href="/admin/settings"
        onClick={() => unlockIdleDocument()}
      >
        <ArrowLeft aria-hidden className="size-4" />
        All settings
      </Link>
      {found ? (
        <>
          <span aria-hidden className="text-muted-foreground/50">
            /
          </span>
          <span
            className={cn(
              "text-muted-foreground",
              found.page.danger && "text-destructive",
            )}
          >
            {found.group.label}
          </span>
        </>
      ) : null}
    </div>
  );
}

/** Tabs across a page that has sibling sub-pages (Site wording's five),
 * so moving between them doesn't mean going back to the table each time.
 * Renders nothing on an ordinary page. */
export function SettingsSubPageTabs() {
  const pathname = usePathname();
  const siblings = findSettingsPage(pathname)?.page.children;
  const activeRef = useRef<HTMLAnchorElement>(null);

  // On a phone the tabs scroll sideways — bring the current one into view
  // rather than leaving it hidden off the right-hand edge.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [pathname]);

  if (!siblings) return null;

  return (
    <nav aria-label="Pages in this section" className="-mx-1 overflow-x-auto px-1 pb-1">
      <ul className="inline-flex min-w-max items-center gap-1 rounded-lg bg-muted p-1">
        {siblings.map((child) => {
          const active = child.href === pathname;
          return (
            <li key={child.href}>
              <Link
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block rounded-md px-3 py-1.5 text-sm whitespace-nowrap transition-colors",
                  active
                    ? "bg-background font-medium text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                href={child.href}
                onClick={() => unlockIdleDocument()}
                ref={active ? activeRef : undefined}
              >
                {child.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
