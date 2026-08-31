"use client";

import { cn } from "@/lib/utils";

const GROUPS = [
  { id: "identity", label: "Identity" },
  { id: "homepage-layout", label: "Layout" },
  { id: "homepage-copy", label: "Homepage copy" },
  { id: "site-chrome", label: "Site chrome" },
] as const;

const jumpLinkClassName =
  "block rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground";

export function DisplaySettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10 xl:gap-12">
      <nav aria-label="On this page" className="lg:hidden">
        <ul className="-mx-1 flex gap-1 overflow-x-auto pb-1">
          {GROUPS.map((group) => (
            <li className="shrink-0" key={group.id}>
              <a
                className={cn(
                  jumpLinkClassName,
                  "whitespace-nowrap border px-3 py-1.5 text-xs uppercase tracking-wider",
                )}
                href={`#${group.id}`}
              >
                {group.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <nav
        aria-label="On this page"
        className="hidden shrink-0 lg:block lg:w-36 xl:w-40"
      >
        <ul className="sticky top-24 flex flex-col gap-0.5 text-sm">
          {GROUPS.map((group) => (
            <li key={group.id}>
              <a className={jumpLinkClassName} href={`#${group.id}`}>
                {group.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="flex min-w-0 flex-1 flex-col gap-10">{children}</div>
    </div>
  );
}
