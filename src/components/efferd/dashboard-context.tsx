"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { DashboardData } from "./dashboard-data";

const DashboardDataContext = createContext<DashboardData | null>(null);

/** Hands the site's figures to Efferd's dashboard pieces, in place of their sample data. */
export function DashboardDataProvider({ data, children }: { data: DashboardData; children: ReactNode }) {
  return <DashboardDataContext.Provider value={data}>{children}</DashboardDataContext.Provider>;
}

export function useDashboardData(): DashboardData {
  const value = useContext(DashboardDataContext);
  if (!value) throw new Error("useDashboardData needs DashboardDataProvider");
  return value;
}

/** Walks' dates as Efferd's tables show them, e.g. "Sat 2 Nov". */
export function walkDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Europe/London",
  });
}

/** "Today", "Tomorrow", "In 3 days" or the date, for walks coming up. */
export function walkIn(iso: string) {
  const day = (date: Date) => Date.parse(date.toLocaleDateString("en-CA", { timeZone: "Europe/London" }));
  const days = Math.round((day(new Date(iso)) - day(new Date())) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 7) return `In ${days} days`;
  return walkDate(iso);
}
