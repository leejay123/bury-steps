"use client";

import { createContext, useContext } from "react";
import { WALK_WORDING_DEFAULTS, type WalkWording } from "@/lib/walk-wording";

/**
 * The walk page's status lines, countdown and messages (Settings → Site
 * wording → Walk page cards), handed down once from the root layout.
 */
const WalkWordingContext = createContext<WalkWording>(WALK_WORDING_DEFAULTS);

export function WalkWordingProvider({ children, wording }: { children: React.ReactNode; wording: WalkWording }) {
  return <WalkWordingContext.Provider value={wording}>{children}</WalkWordingContext.Provider>;
}

export function useWalkWording() {
  return useContext(WalkWordingContext);
}
