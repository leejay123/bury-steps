"use client";

import { startTransition, useState } from "react";
import { updateWalkPageLayout } from "@/server/actions";
import { useActionToast } from "@/hooks/use-action-toast";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { useSafeActionState } from "@/hooks/use-safe-action-state";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WALK_IDEA_LAYOUTS, type WalkPageLayout } from "@/lib/walk-page-sections";
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
      description="How a walk's page is laid out when someone opens a walk — the same for members and organisers. Two columns keeps clock-in, the share link and the organiser buttons in view on a computer, and puts the map and weather, who attended and the journey in tabs, so there's less to scroll. Phones show it in one column, clock-in first. A to D are one column with tabs: A puts a row of actions under the title; B keeps the tab bar at the top as you scroll; C starts with what's happening now; D shows summary boxes that open their tab. 1 to 20 are further designs to try."
      title="Layout"
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
            <SelectItem value="columns">Two columns with tabs</SelectItem>
            <SelectItem value="strip">A · One column, action strip + tabs</SelectItem>
            <SelectItem value="sticky">B · One column, sticky tab bar</SelectItem>
            <SelectItem value="status">C · One column, status first</SelectItem>
            <SelectItem value="tiles">D · One column, summary tiles</SelectItem>
            {WALK_IDEA_LAYOUTS.map((idea, i) => (
              <SelectItem key={idea.id} value={idea.id}>
                {`${i + 1} · ${idea.label}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </SettingsSection>
  );
}
