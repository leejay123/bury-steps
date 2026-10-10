"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore, useTransition } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  readPlaceholderPreview,
  setPlaceholderPreview,
  type PlaceholderPreviewMode,
} from "@/lib/placeholder-preview-cookie";
import { SettingsSection } from "../settings-page";

const noopSubscribe = () => () => {};

/** Owners only, and only for this browser — see placeholder-preview-cookie.ts. */
export function PlaceholderPreviewToggle() {
  const router = useRouter();
  const saved = useSyncExternalStore(noopSubscribe, readPlaceholderPreview, () => null);
  const [override, setOverride] = useState<PlaceholderPreviewMode | "off" | null>(null);
  const [, startTransition] = useTransition();
  const value = override ?? saved ?? "off";
  return (
    <SettingsSection
      description="Temporary, for checking the loading placeholders. In this browser only — nobody else is affected. Hold keeps each page's grey placeholder up for 5 seconds before its content, so you can click into a notice or a walk and see its placeholder too. Always shows only the placeholders. A label at the bottom of the screen turns it off."
      title="Preview loading placeholders (temporary)"
    >
      <div className="flex w-full flex-col gap-1.5">
        <Label htmlFor="placeholder-preview">Preview</Label>
        <Select
          onValueChange={(next) => {
            const mode = next === "off" ? null : (next as PlaceholderPreviewMode);
            setPlaceholderPreview(mode);
            setOverride(mode ?? "off");
            startTransition(() => router.refresh());
          }}
          value={value}
        >
          <SelectTrigger className="w-full sm:w-[24rem]" id="placeholder-preview">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="off">Off</SelectItem>
            <SelectItem value="hold">Hold placeholders for 5 seconds</SelectItem>
            <SelectItem value="always">Always show placeholders</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </SettingsSection>
  );
}
