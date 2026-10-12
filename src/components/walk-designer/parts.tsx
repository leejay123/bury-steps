"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { WalkIdeaParts } from "@/components/walk-idea-layouts";

/**
 * The walk's parts (its details, map, forecast, clock-in, who attended…)
 * handed to every block of a designed walk page. A block doesn't fetch
 * anything itself: the walk page works the parts out exactly as it does for
 * every other layout, and the blocks only arrange and style them.
 */
const WalkPartsContext = createContext<WalkIdeaParts | null>(null);

export function WalkPartsProvider({ children, parts }: { children: ReactNode; parts: WalkIdeaParts }) {
  return <WalkPartsContext.Provider value={parts}>{children}</WalkPartsContext.Provider>;
}

export function useWalkParts(): WalkIdeaParts | null {
  return useContext(WalkPartsContext);
}
