"use client";

import { createContext, useContext } from "react";
import { DEFAULT_WALK_ESSENTIALS, essentialIcon, walkEssentialItems, type EssentialItem } from "@/lib/walk-essentials";

/**
 * The owner's Walk essentials list (Settings → Walk essentials), handed
 * down once from the root layout so the walk form and every walk page use
 * the same labels and icons without passing it through each component.
 */
const WalkEssentialsContext = createContext<EssentialItem[]>(DEFAULT_WALK_ESSENTIALS);

export function WalkEssentialsProvider({ children, items }: { children: React.ReactNode; items: EssentialItem[] }) {
  return <WalkEssentialsContext.Provider value={items}>{children}</WalkEssentialsContext.Provider>;
}

export function useWalkEssentials() {
  return useContext(WalkEssentialsContext);
}

/** A walk's ticked essentials as one row of pills that scrolls sideways. */
export function WalkEssentialPills({ keys }: { keys: readonly string[] | null | undefined }) {
  const items = walkEssentialItems(keys, useWalkEssentials());
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Essentials</p>
      {/* One row that scrolls sideways rather than wrapping onto several lines. */}
      <ul className="flex gap-1.5 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => {
          const Icon = essentialIcon(item.icon);
          return (
            <li
              className="flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs whitespace-nowrap"
              key={item.key}
            >
              <Icon aria-hidden="true" className="size-3.5 text-muted-foreground" />
              {item.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
