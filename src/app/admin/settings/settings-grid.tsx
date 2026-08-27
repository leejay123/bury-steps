"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { unlockIdleDocument } from "@/components/overlay-root";
import { DataList, DataListBody, DataListItem } from "@/components/data-list";

export function SettingsGrid({
  items,
}: {
  items: { description: string; href: string; title: string }[];
}) {
  return (
    <DataList>
      {items.map((item) => (
        <DataListItem className="relative" key={item.href}>
          <DataListBody>
            <p className="font-semibold leading-none">
              <Link
                className="after:absolute after:inset-0"
                href={item.href}
                onClick={() => {
                  unlockIdleDocument();
                }}
                onPointerDown={() => {
                  unlockIdleDocument();
                }}
              >
                {item.title}
              </Link>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
          </DataListBody>
          <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        </DataListItem>
      ))}
    </DataList>
  );
}
