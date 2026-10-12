"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { WalkIdeaParts } from "@/components/walk-idea-layouts";
import type { WalkDesignAudience } from "@/lib/walk-page-choice";

/**
 * The walk's parts (its details, map, forecast, clock-in, who attended…)
 * handed to every block of a designed walk page. A block doesn't fetch
 * anything itself: the walk page works the parts out exactly as it does for
 * every other layout, and the blocks only arrange and style them.
 */
const WalkPartsContext = createContext<WalkIdeaParts | null>(null);

/**
 * The designer's chosen audience, so its preview shows what they'd see —
 * including parts the site hides from whoever's signed in (visitors' "How
 * this group works", for example). Real walk pages don't set it.
 */
export const PreviewAudience = createContext<WalkDesignAudience | null>(null);

export function WalkPartsProvider({
  children,
  parts,
}: {
  children: ReactNode;
  parts: WalkIdeaParts;
}) {
  return (
    <WalkPartsContext.Provider value={parts}>
      {children}
    </WalkPartsContext.Provider>
  );
}

export function useWalkParts(): WalkIdeaParts | null {
  return useContext(WalkPartsContext);
}
