"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { SiteDesign } from "@/lib/site-theme";

/**
 * Which site design is on (Settings → Branding → Site design), for client
 * components that lay themselves out differently in the shadcn.io design
 * (e.g. the Walks table card). Original unless the layout says otherwise.
 */
const SiteDesignContext = createContext<SiteDesign>("original");

export function SiteDesignProvider({ design, children }: { design: SiteDesign; children: ReactNode }) {
  return <SiteDesignContext.Provider value={design}>{children}</SiteDesignContext.Provider>;
}

export function useSiteDesign() {
  return useContext(SiteDesignContext);
}
