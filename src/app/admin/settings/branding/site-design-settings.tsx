"use client";

import { startTransition, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateSiteDesign } from "@/server/actions";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { useSafeActionState } from "@/hooks/use-safe-action-state";
import type { SiteDesign } from "@/lib/site-theme";
import { cn } from "@/lib/utils";
import { SettingsSection } from "../settings-page";

const DESIGNS: { id: SiteDesign; label: string; note: string }[] = [
  { id: "original", label: "Original", note: "The site as it has always looked: your chosen font, 8px corners." },
  {
    id: "vercel",
    label: "Vercel",
    note: "Vercel's look: the Geist font, ink and fine greys, 6px corners, soft layered shadows and tighter headings.",
  },
];

/** The whole site's look, for everyone: the original, or the Vercel-inspired one. */
export function SiteDesignSettings({ design }: { design: SiteDesign }) {
  const [selected, setSelected] = useState(design);
  const [state, dispatch, isPending] = useSafeActionState(updateSiteDesign);

  useResetOnChange([design], () => setSelected(design));
  useResetOnChange([state, design], () => {
    if (state && !state.ok) setSelected(design);
  });
  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      if (state.message) toast.success(state.message);
    } else toast.error(state.error);
  }, [state]);

  function choose(next: SiteDesign) {
    if (next === selected) return;
    setSelected(next);
    const formData = new FormData();
    formData.set("siteDesign", next);
    startTransition(() => dispatch(formData));
  }

  return (
    <SettingsSection
      description="The look of the whole website for everyone. Layouts and features stay the same; you can switch back at any time."
      title="Site design"
    >
      <div className="grid w-full gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Site design">
        {DESIGNS.map((option) => (
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
