"use client";

import { startTransition, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateDashboardDesign } from "@/server/actions";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { useSafeActionState } from "@/hooks/use-safe-action-state";
import type { DashboardDesign } from "@/lib/site-theme";
import { cn } from "@/lib/utils";
import { SettingsSection } from "../settings-page";

const STYLES: { id: DashboardDesign; label: string; note: string }[] = [
  { id: "1", label: "Design 1", note: "A welcome over one bordered grid: figures, a chart, the latest list and upcoming walks." },
  { id: "2", label: "Design 2", note: "A dense bordered grid: four figures, a bar chart, notices, walks and the latest list." },
  { id: "3", label: "Design 3", note: "A grid of separate cards with two charts, walks and the latest list; a soft grey menu." },
  { id: "4", label: "Design 4", note: "Cards with quick actions, set inside a grey frame (the page as a rounded white panel)." },
];

/** The dashboard view's design (Efferd dashboards 1 to 4), for everyone. Owners can also switch it on the dashboard. */
export function DashboardDesignSettings({ design: style }: { design: DashboardDesign }) {
  const [selected, setSelected] = useState(style);
  const [state, dispatch, isPending] = useSafeActionState(updateDashboardDesign);

  useResetOnChange([style], () => setSelected(style));
  useResetOnChange([state, style], () => {
    if (state && !state.ok) setSelected(style);
  });
  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      if (state.message) toast.success(state.message);
    } else toast.error(state.error);
  }, [state]);

  function choose(next: DashboardDesign) {
    if (next === selected) return;
    setSelected(next);
    const formData = new FormData();
    formData.set("dashboardDesign", next);
    startTransition(() => dispatch(formData));
  }

  return (
    <SettingsSection
      description="A test alongside the normal site: signed-in people see a Dashboard button by their photo. It opens every page inside a dashboard frame with a side menu, and an Overview page in this design. Owners can also switch design on the Overview."
      title="Dashboard design"
    >
      <div aria-label="Dashboard design" className="grid w-full gap-2 sm:grid-cols-2" role="radiogroup">
        {STYLES.map((option) => (
          <button
            aria-checked={selected === option.id}
            className={cn(
              "flex flex-col items-start gap-1 rounded-lg border p-4 text-left transition-colors hover:bg-muted/50",
              selected === option.id && "border-foreground/40 bg-muted/60",
            )}
            disabled={isPending}
            key={option.id}
            onClick={() => choose(option.id)}
            role="radio"
            type="button"
          >
            <span className="flex items-center gap-2 font-medium">
              {option.label}
              {isPending && selected === option.id ? (
                <Loader2 aria-label="Saving" className="size-3.5 animate-spin text-muted-foreground" />
              ) : null}
            </span>
            <span className="text-sm text-muted-foreground">{option.note}</span>
          </button>
        ))}
      </div>
    </SettingsSection>
  );
}
