"use client";

import { Loader2 } from "lucide-react";
import { updateOrganiserInviteRequired } from "@/server/actions";
import { useOptimisticSettingToggle } from "@/hooks/use-optimistic-setting-toggle";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { SettingsSection } from "../settings-page";

export function OrganiserInviteToggle({ enabled }: { enabled: boolean }) {
  const { on, toggle, isPending } = useOptimisticSettingToggle({
    action: updateOrganiserInviteRequired,
    enabled,
    formKey: "organiserInviteRequired",
  });

  return (
    <SettingsSection
      description="When on, making someone an organiser sends them an email invite instead of taking effect straight away — they only become an organiser once they accept it. When off, promoting someone works immediately, as before."
      title="Require accepted invite"
    >
      <div className="flex items-center justify-between gap-4 rounded-lg border bg-background px-4 py-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <Label className="font-medium" htmlFor="organiser-invite-required">
            Require accepted invite
          </Label>
        </div>
        {isPending ? (
          <Loader2 aria-label="Saving" className="size-4 shrink-0 animate-spin text-muted-foreground" role="status" />
        ) : (
          <Checkbox
            checked={on}
            id="organiser-invite-required"
            onCheckedChange={(value) => toggle(value === true)}
          />
        )}
      </div>
    </SettingsSection>
  );
}
