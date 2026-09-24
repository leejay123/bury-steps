"use client";

import { Loader2 } from "lucide-react";
import { updateMemberNoticesEnabled } from "@/server/actions";
import { useOptimisticSettingToggle } from "@/hooks/use-optimistic-setting-toggle";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SettingsSection } from "../settings-page";

export function MemberNoticesToggle({ enabled }: { enabled: boolean }) {
  const { on, toggle, isPending } = useOptimisticSettingToggle({
    action: updateMemberNoticesEnabled,
    enabled,
    formKey: "memberNoticesEnabled",
  });

  return (
    <SettingsSection
      description="Signed-in members see recent notices in a carousel on the homepage. Turning this off hides that section for everyone, even when there are notices — the bell and the Notices page are unaffected."
      title="Latest notices"
    >
      <div className="flex items-center justify-between gap-4 rounded-lg border bg-background px-4 py-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <Label className="font-medium" htmlFor="member-notices-enabled">
            Show on the homepage
          </Label>
        </div>
        {isPending ? (
          <Loader2 aria-label="Saving" className="size-4 shrink-0 animate-spin text-muted-foreground" role="status" />
        ) : (
          <Switch checked={on} id="member-notices-enabled" onCheckedChange={toggle} />
        )}
      </div>
    </SettingsSection>
  );
}
