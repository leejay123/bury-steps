"use client";

import { createContext, useContext, type ReactNode } from "react";

type SiteDesign = "shadcnio" | "original";

/**
 * Always the shadcn.io design now. Kept so existing client components that
 * branch on design keep compiling; they all take the shadcn.io path.
 */
const SiteDesignContext = createContext<SiteDesign>("shadcnio");

export function SiteDesignProvider({ design, children }: { design?: SiteDesign; children: ReactNode }) {
  return <SiteDesignContext.Provider value={design ?? "shadcnio"}>{children}</SiteDesignContext.Provider>;
}

export function useSiteDesign() {
  return useContext(SiteDesignContext);
}
