"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SettingsGrid({
  items,
}: {
  items: { description: string; href: string; title: string }[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <Link className="block cursor-pointer" href={item.href} key={item.href}>
          <Card className="h-full hover:bg-accent/40">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div className="flex flex-col gap-1.5">
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </div>
              <ChevronRight className="mt-0.5 shrink-0 text-muted-foreground" />
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}
