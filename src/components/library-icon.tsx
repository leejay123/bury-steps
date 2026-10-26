"use client";

import { lazy, Suspense, type ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import type { IconName } from "lucide-react/dynamic";
import { cn } from "@/lib/utils";

/**
 * Any icon from the free Lucide library, by its name ("tree-pine"), for
 * essentials and facts beyond the hand-picked set. The library's own
 * DynamicIcon loads each icon only when it's shown, and the loader itself
 * only on a page that uses one, so the hand-picked icons cost nothing more.
 * While it loads, an empty box of the same size holds its place.
 */
const DynamicIcon = lazy(() =>
  import("lucide-react/dynamic").then((library) => ({ default: library.DynamicIcon })),
);

const made = new Map<string, ComponentType<LucideProps>>();

export function libraryIcon(name: string): ComponentType<LucideProps> {
  const known = made.get(name);
  if (known) return known;
  function LibraryIcon(props: LucideProps) {
    const holder = <span aria-hidden className={cn("inline-block size-6 shrink-0", props.className)} />;
    const Holder = () => holder;
    return (
      <Suspense fallback={holder}>
        <DynamicIcon {...props} fallback={Holder} name={name as IconName} />
      </Suspense>
    );
  }
  made.set(name, LibraryIcon);
  return LibraryIcon;
}

/** Every icon name in the library, loaded when first asked for (the picker's search). */
export async function libraryIconNames(): Promise<string[]> {
  const library = await import("lucide-react/dynamic");
  return library.iconNames as string[];
}
