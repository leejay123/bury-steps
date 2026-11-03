import type { WalkStatus } from "@/lib/walk-window";

export type WalkCrumbStep = { href: string; label: string };

export const ADMIN_WALKS_HISTORY_HREF = "/admin/walks?tab=past";
export const MEMBER_WALKS_ALL_HREF = "/walks?tab=all-walks";

/**
 * Top-bar trail for a walk page, matching where that walk sits in the list:
 * Upcoming stays Walks › title; finished and cancelled sit under History
 * (organisers) or All walks / History (members).
 */
export function walkHeaderTrail(
  audience: "organiser" | "member",
  status: WalkStatus,
): WalkCrumbStep[] {
  if (audience === "organiser") {
    if (status === "completed" || status === "cancelled") {
      return [
        { href: "/admin/walks", label: "Walks" },
        { href: ADMIN_WALKS_HISTORY_HREF, label: "History" },
      ];
    }
    return [{ href: "/admin/walks", label: "Walks" }];
  }
  if (status === "cancelled") {
    return [
      { href: "/walks", label: "Walks" },
      { href: MEMBER_WALKS_ALL_HREF, label: "All walks" },
    ];
  }
  if (status === "completed") {
    return [{ href: "/history", label: "History" }];
  }
  return [{ href: "/walks", label: "Walks" }];
}
