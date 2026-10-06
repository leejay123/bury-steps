"use client";

import { startTransition, useState } from "react";
import { updatePageTransition } from "@/server/actions";
import { useActionToast } from "@/hooks/use-action-toast";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { useSafeActionState } from "@/hooks/use-safe-action-state";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PageTransition } from "@/lib/page-transition";
import { SettingsSection } from "../settings-page";

/** Saves as soon as a choice is picked, like the switches on this page. */
export function PageTransitionSettings({ mode }: { mode: PageTransition }) {
  const [value, setValue] = useState(mode);
  const [state, action] = useSafeActionState(updatePageTransition);
  // No inline error box here, so a failed save says so in a toast.
  useActionToast(state, undefined, { toastErrors: true });
  useResetOnChange([mode], () => setValue(mode));
  useResetOnChange([state], () => {
    if (state && !state.ok) setValue(mode);
  });

  return (
    <SettingsSection
      description="How the page changes when someone moves around the site. Try each one and see which feels best."
      title="Page transitions"
    >
      <div className="flex w-full flex-col gap-1.5">
        <Label htmlFor="page-transition">Style</Label>
        <Select
          onValueChange={(next) => {
            setValue(next as PageTransition);
            const formData = new FormData();
            formData.set("pageTransition", next);
            startTransition(() => action(formData));
          }}
          value={value}
        >
          <SelectTrigger className="w-full sm:w-[24rem]" id="page-transition">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fade">Quick fade</SelectItem>
            <SelectItem value="slide">Slide in and out of pages</SelectItem>
            <SelectItem value="rise">Rise up (like the walk cards)</SelectItem>
            <SelectItem value="none">No transition (instant)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </SettingsSection>
  );
}
