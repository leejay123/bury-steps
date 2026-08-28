import { Badge } from "@/components/ui/badge";
import { type WalkStatus } from "@/lib/walk-window";

const LABEL: Record<WalkStatus, string> = {
  cancelled: "Cancelled",
  upcoming: "Upcoming",
  open: "Clock-in open",
  completed: "Completed",
};

const VARIANT: Record<WalkStatus, "destructive" | "default" | "secondary" | "outline"> = {
  cancelled: "destructive",
  upcoming: "secondary",
  open: "default",
  completed: "outline",
};

/**
 * Shared status pill so the walk list and a walk's own detail page always
 * agree. Takes an already-computed status (see `walkStatus` in
 * `@/lib/walk-window`) rather than raw walk fields, so it's computed once
 * server-side against the server's clock instead of recomputed per-render
 * against whatever clock the browser happens to have.
 */
export function WalkStatusBadge({ status }: { status: WalkStatus }) {
  return <Badge variant={VARIANT[status]}>{LABEL[status]}</Badge>;
}
