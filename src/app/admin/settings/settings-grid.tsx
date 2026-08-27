"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function SettingsGrid({
  items,
}: {
  items: { description: string; href: string; title: string }[];
}) {
  return (
    <div className="flex flex-col border-t [&>a:not(:last-child)]:border-b">
      {items.map((item) => (
        <Link
          className="flex items-start justify-between gap-3 bg-background px-4 py-5 hover:bg-neutral-100 md:px-6"
          href={item.href}
          key={item.href}
        >
          <div className="flex flex-col gap-1">
            <p className="font-semibold leading-none">{item.title}</p>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </div>
          <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        </Link>
      ))}
    </div>
  );
}
