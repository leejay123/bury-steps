"use client";

import { startTransition, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updatePageTopStyle } from "@/server/actions";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { useSafeActionState } from "@/hooks/use-safe-action-state";
import type { PageTopStyle } from "@/lib/site-theme";
import { cn } from "@/lib/utils";
import { SettingsSection } from "../settings-page";

const STYLES: { id: PageTopStyle; label: string; note: string }[] = [
  { id: "plain", label: "Plain", note: "A white band, edge to edge, with a thin line under it." },
  { id: "grey", label: "Grey", note: "A light grey band across the full width." },
  { id: "big", label: "Big title", note: "In the style of shadcn.io: a larger title and intro, with + marks on the line under it." },
  { id: "dark", label: "Dark", note: "A near-black band with white words and a white button." },
];

/** The band at the top of each page (title, intro, button), for everyone. */
export function PageTopSettings({ style }: { style: PageTopStyle }) {
  const [selected, setSelected] = useState(style);
  const [state, dispatch, isPending] = useSafeActionState(updatePageTopStyle);

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

  function choose(next: PageTopStyle) {
    if (next === selected) return;
    setSelected(next);
    const formData = new FormData();
    formData.set("pageTopStyle", next);
    startTransition(() => dispatch(formData));
  }

  return (
    <SettingsSection
      description="The band at the top of pages like Walks, Members, Messages, Reports and the Guide: the page title, its short intro and its button. It runs edge to edge; everything below keeps its usual space."
      title="Page tops"
    >
      <div aria-label="Page tops" className="grid w-full gap-2 sm:grid-cols-2" role="radiogroup">
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
