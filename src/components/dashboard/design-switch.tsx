"use client";

import { startTransition, useEffect } from "react";
import { toast } from "sonner";
import { updateDashboardDesign } from "@/server/actions";
import { useSafeActionState } from "@/hooks/use-safe-action-state";
import { cn } from "@/lib/utils";
import { enterDashboardView } from "./dashboard-view";

/** Opening /dashboard straight (a link, a bookmark) turns the dashboard view on. */
export function EnterDashboardView() {
  useEffect(() => {
    enterDashboardView();
  }, []);
  return null;
}

/** Owners' quick switch on the Overview: the same choice as Settings → Branding → Dashboard design. */
export function DashboardDesignSwitch({ design }: { design: string }) {
  const [state, dispatch, isPending] = useSafeActionState(updateDashboardDesign);
  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      if (state.message) toast.success(state.message);
    } else toast.error(state.error);
  }, [state]);

  return (
    <div aria-label="Dashboard design" className="flex items-center gap-1 rounded-lg border p-1" role="radiogroup">
      <span className="px-2 text-xs text-muted-foreground">Design</span>
      {["1", "2", "3", "4"].map((id) => (
        <button
          aria-checked={design === id}
          className={cn(
            "size-7 rounded-md text-sm tabular-nums hover:bg-muted",
            design === id && "bg-foreground text-background hover:bg-foreground",
          )}
          disabled={isPending}
          key={id}
          onClick={() => {
            if (id === design) return;
            const formData = new FormData();
            formData.set("dashboardDesign", id);
            startTransition(() => dispatch(formData));
          }}
          role="radio"
          type="button"
        >
          {id}
        </button>
      ))}
    </div>
  );
}
