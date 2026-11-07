"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ShadcnHomeData } from "@/components/shadcnio/home-data";
import { DEFAULT_WALK_ESSENTIALS, type EssentialItem } from "@/lib/walk-essentials";

export type SitePageLive = {
  data: ShadcnHomeData;
  logo: { src: string; width: number; height: number };
  joinHref: string;
  facebookUrl: string;
  walkEssentials: EssentialItem[];
};

const EMPTY: SitePageLive = {
  data: {
    upcomingCount: 0,
    members: 0,
    walksThisYear: 0,
    year: new Date().getFullYear(),
    upcoming: [],
    places: [],
    next: null,
  },
  logo: { src: "/bury-steps-logo.png", width: 96, height: 96 },
  joinHref: "/sign-up",
  facebookUrl: "",
  walkEssentials: DEFAULT_WALK_ESSENTIALS,
};

const Live = createContext<SitePageLive>(EMPTY);

export function SitePageLiveProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: SitePageLive;
}) {
  return <Live.Provider value={value}>{children}</Live.Provider>;
}

export function useSitePageLive(): SitePageLive {
  return useContext(Live);
}
