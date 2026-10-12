"use client";

import { startTransition, useState } from "react";
import { updateTabStyle } from "@/server/actions";
import { useActionToast } from "@/hooks/use-action-toast";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { useSafeActionState } from "@/hooks/use-safe-action-state";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TabStyle } from "@/lib/tab-style";
import { SettingsSection } from "../settings-page";

/** Saves as soon as a choice is picked, like the switches on this page. */
export function TabStyleSettings({ style }: { style: TabStyle }) {
  const [value, setValue] = useState(style);
  const [state, action] = useSafeActionState(updateTabStyle);
  // No inline error box here, so a failed save says so in a toast.
  useActionToast(state, undefined, { toastErrors: true });
  useResetOnChange([style], () => setValue(style));
  useResetOnChange([state], () => {
    if (state && !state.ok) setValue(style);
  });

  return (
    <SettingsSection
      description="How every tab bar on the site looks — Upcoming and All walks on Walks, the walk page's tabs, and the rest. Underline is the shadcn-space tabs-05 style: a line under the chosen tab that slides across, and the tab's content sliding in from that side. Pills fills in the chosen tab, and its content drops in from above with a slight blur."
      title="Tabs"
    >
      <div className="flex w-full flex-col gap-1.5">
        <Label htmlFor="tab-style">Style</Label>
        <Select
          onValueChange={(next) => {
            setValue(next as TabStyle);
            const formData = new FormData();
            formData.set("tabStyle", next);
            startTransition(() => action(formData));
          }}
          value={value}
        >
          <SelectTrigger className="w-full sm:w-[24rem]" id="tab-style">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="standard">Standard (grey pill)</SelectItem>
            <SelectItem value="underline">Underline (tabs-05, test)</SelectItem>
            <SelectItem value="transition">Pills with a drop-in (test)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </SettingsSection>
  );
}
