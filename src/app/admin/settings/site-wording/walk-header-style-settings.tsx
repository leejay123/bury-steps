"use client";

import { startTransition, useState } from "react";
import { updateWalkHeaderStyle } from "@/server/actions";
import { useActionToast } from "@/hooks/use-action-toast";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { useSafeActionState } from "@/hooks/use-safe-action-state";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { WalkHeaderStyle } from "@/lib/walk-page-sections";
import { SettingsSection } from "../settings-page";

/** Saves as soon as a choice is picked, like the Layout above it. */
export function WalkHeaderStyleSettings({ style }: { style: WalkHeaderStyle }) {
  const [value, setValue] = useState(style);
  const [state, action] = useSafeActionState(updateWalkHeaderStyle);
  // No inline error box here, so a failed save says so in a toast.
  useActionToast(state, undefined, { toastErrors: true });
  useResetOnChange([style], () => setValue(style));
  useResetOnChange([state], () => {
    if (state && !state.ok) setValue(style);
  });

  return (
    <SettingsSection
      description="For the one-column layouts with tabs (A to D): how the walk's name and its controls are shown at the top. Standard keeps the controls where the layout puts them. H1 puts them beside the name, with the rest under More. H2 puts them in a bar above a big name and four key facts. H3 is a box with a coloured status band and one Manage button. H4 groups them in two boxes: You, and Organise this walk."
      title="Header"
    >
      <div className="flex w-full flex-col gap-1.5">
        <Label htmlFor="walk-header-style">Header style</Label>
        <Select
          onValueChange={(next) => {
            setValue(next as WalkHeaderStyle);
            const formData = new FormData();
            formData.set("walkHeaderStyle", next);
            startTransition(() => action(formData));
          }}
          value={value}
        >
          <SelectTrigger className="w-full sm:w-[24rem]" id="walk-header-style">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="standard">Standard</SelectItem>
            <SelectItem value="buttons">H1 · Buttons beside the name</SelectItem>
            <SelectItem value="toolbar">H2 · Toolbar above the name</SelectItem>
            <SelectItem value="band">H3 · Status band + Manage menu</SelectItem>
            <SelectItem value="grouped">H4 · Grouped controls</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </SettingsSection>
  );
}
