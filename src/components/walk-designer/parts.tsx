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

/**
 * Who a real walk page's design is drawn for (the walk page draws the
 * members' and the visitors' designs, and shows the right one), so a tab or
 * section set to signed-in or signed-out people only can leave itself out.
 */
export const ViewerAudience = createContext<WalkDesignAudience | null>(null);

/** Who's looking: the designer's chosen audience, or the page's. */
export function useViewerAudience(): WalkDesignAudience | null {
  const preview = useContext(PreviewAudience);
  const viewer = useContext(ViewerAudience);
  return preview ?? viewer;
}

/** Whether a tab or section set to "Show to" this choice is for that viewer. */
export function shownTo(showTo: string | undefined, viewer: WalkDesignAudience | null): boolean {
  if (!showTo || showTo === "everyone" || !viewer) return true;
  return showTo === "visitors" ? viewer === "visitor" : viewer !== "visitor";
}

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
