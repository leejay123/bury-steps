"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { FullWidthDivider } from "@/components/full-width-divider";
import { GridFiller } from "@/components/grid-filler";

export function SettingsGrid({
  items,
}: {
  items: { description: string; href: string; title: string }[];
}) {
  return (
    <div className="relative">
      <div className="grid w-full grid-cols-1 gap-px bg-border sm:grid-cols-2">
        {items.map((item) => (
          <Link
            className="flex h-full items-start justify-between gap-3 bg-background p-6 hover:bg-accent/40 md:p-8"
            href={item.href}
            key={item.href}
          >
            <div className="flex flex-col gap-1.5">
              <p className="font-semibold leading-none">{item.title}</p>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
            <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
        <GridFiller className="bg-background" smColumns={2} totalItems={items.length} />
      </div>
      <FullWidthDivider position="bottom" />
    </div>
  );
}
