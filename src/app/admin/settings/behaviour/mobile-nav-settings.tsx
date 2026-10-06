"use client";

import { startTransition, useState } from "react";
import { updateMobileNav } from "@/server/actions";
import { useActionToast } from "@/hooks/use-action-toast";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { useSafeActionState } from "@/hooks/use-safe-action-state";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SettingsSection } from "../settings-page";

type MobileNav = "bottom" | "menu";

/** Saves as soon as a choice is picked, like the switches on this page. */
export function MobileNavSettings({ style }: { style: MobileNav }) {
  const [value, setValue] = useState(style);
  const [state, action] = useSafeActionState(updateMobileNav);
  // No inline error box here, so a failed save says so in a toast.
  useActionToast(state, undefined, { toastErrors: true });
  useResetOnChange([style], () => setValue(style));
  useResetOnChange([state], () => {
    if (state && !state.ok) setValue(style);
  });

  return (
    <SettingsSection
      description="How signed-in people move around the site on phones. Tablets and computers always use the menu bar across the top."
      title="Phone menu"
    >
      <div className="flex w-full flex-col gap-1.5">
        <Label htmlFor="mobile-nav">Style</Label>
        <Select
          onValueChange={(next) => {
            setValue(next as MobileNav);
            const formData = new FormData();
            formData.set("mobileNav", next);
            startTransition(() => action(formData));
          }}
          value={value}
        >
          <SelectTrigger className="w-full sm:w-[24rem]" id="mobile-nav">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bottom">Bottom bar (logo on the left)</SelectItem>
            <SelectItem value="menu">Original ☰ menu (logo in the middle)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </SettingsSection>
  );
}
