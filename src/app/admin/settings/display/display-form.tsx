"use client";

import { updateScrollToTopEnabled } from "@/server/actions";
import { useOptimisticSettingToggle } from "@/hooks/use-optimistic-setting-toggle";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function DisplaySettings({ scrollToTopEnabled }: { scrollToTopEnabled: boolean }) {
  const { on, toggle, isPending } = useOptimisticSettingToggle({
    action: updateScrollToTopEnabled,
    enabled: scrollToTopEnabled,
    formKey: "scrollToTopEnabled",
  });

  return (
    <div className="flex items-start gap-3 rounded-xl border p-4">
      <Checkbox
        checked={on}
        disabled={isPending}
        id="scroll-to-top"
        onCheckedChange={(value) => toggle(value === true)}
      />
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Label htmlFor="scroll-to-top">Show the back to top button</Label>
          {isPending ? <span className="text-xs text-muted-foreground">Saving…</span> : null}
        </div>
        <p className="text-sm text-muted-foreground">
          After you scroll down, a button appears in the corner to jump back to the top. Turn this
          off if you would rather not have it.
        </p>
      </div>
    </div>
  );
}
