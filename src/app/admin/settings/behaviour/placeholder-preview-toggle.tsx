"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore, useTransition } from "react";
import { readPlaceholderPreview, setPlaceholderPreview } from "@/lib/placeholder-preview-cookie";
import { SettingsSwitchSection } from "../settings-page";

const noopSubscribe = () => () => {};

/** Owners only, and only for this browser — see placeholder-preview-cookie.ts. */
export function PlaceholderPreviewToggle() {
  const router = useRouter();
  const saved = useSyncExternalStore(noopSubscribe, readPlaceholderPreview, () => false);
  const [override, setOverride] = useState<boolean | null>(null);
  const [isPending, startTransition] = useTransition();
  const on = override ?? saved;
  return (
    <SettingsSwitchSection
      checked={on}
      description="Temporary, for checking the loading placeholders. In this browser only, pages show their grey placeholder instead of their content (Walks, Notices, Progress, History, Members, Messages, Reports, a walk, a notice). Nobody else is affected. A label at the bottom of the screen turns it off."
      id="placeholder-preview"
      onCheckedChange={(next) => {
        setPlaceholderPreview(next);
        setOverride(next);
        startTransition(() => router.refresh());
      }}
      pending={isPending}
      title="Preview loading placeholders (temporary)"
    />
  );
}
