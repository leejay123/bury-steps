"use client";

import { startTransition, useState } from "react";
import { updateWalkPageLayout } from "@/server/actions";
import { useActionToast } from "@/hooks/use-action-toast";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { useSafeActionState } from "@/hooks/use-safe-action-state";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { WalkPageLayout } from "@/lib/walk-page-sections";
import { SettingsSection } from "../settings-page";

/** Saves as soon as a choice is picked, like Phone menu in Site behaviour. */
export function WalkPageLayoutSettings({ layout }: { layout: WalkPageLayout }) {
  const [value, setValue] = useState(layout);
  const [state, action] = useSafeActionState(updateWalkPageLayout);
  // No inline error box here, so a failed save says so in a toast.
  useActionToast(state, undefined, { toastErrors: true });
  useResetOnChange([layout], () => setValue(layout));
  useResetOnChange([state], () => {
    if (state && !state.ok) setValue(layout);
  });

  return (
    <SettingsSection
      description="How a walk's page is laid out when someone opens a walk — the same for members and organisers. Two columns keeps clock-in, the share link and the organiser buttons in view on a computer, and puts the map and weather, who attended and the journey in tabs, so there's less to scroll. Phones show it in one column, clock-in first."
      title="One or two columns"
    >
      <div className="flex w-full flex-col gap-1.5">
        <Label htmlFor="walk-page-layout">Layout</Label>
        <Select
          onValueChange={(next) => {
            setValue(next as WalkPageLayout);
            const formData = new FormData();
            formData.set("walkPageLayout", next);
            startTransition(() => action(formData));
          }}
          value={value}
        >
          <SelectTrigger className="w-full sm:w-[24rem]" id="walk-page-layout">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="classic">One column (original)</SelectItem>
            <SelectItem value="columns">Two columns with tabs (new)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </SettingsSection>
  );
}
