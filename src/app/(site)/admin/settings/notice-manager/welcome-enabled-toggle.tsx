"use client";

import { setSiteNoticeEnabled } from "@/server/actions";
import type { NoticeView } from "@/lib/notices";
import { useOptimisticSettingToggle } from "@/hooks/use-optimistic-setting-toggle";
import { Switch } from "@/components/ui/switch";

export function WelcomeEnabledToggle({ notice }: { notice: NoticeView }) {
  const { on, toggle, isPending } = useOptimisticSettingToggle({
    action: async (prev, formData) => {
      formData.set("noticeId", notice.id);
      return setSiteNoticeEnabled(prev, formData);
    },
    enabled: notice.enabled,
    formKey: "enabled",
  });

  return (
    <label
      className="relative z-10 flex cursor-pointer items-center gap-2 text-xs text-muted-foreground"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      {/* Stays a switch while it saves (it flips straight away), so the
          label doesn't jump and keyboard focus stays on it. */}
      <Switch aria-busy={isPending || undefined} checked={on} onCheckedChange={toggle} size="sm" />
      <span>{on ? "On in bell" : "Hidden"}</span>
    </label>
  );
}
