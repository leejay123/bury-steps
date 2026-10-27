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
import { readLoadingStyle, setLoadingStyle, subscribeLoadingStyle, type LoadingStyle } from "@/lib/loading-style";
import { SettingsSection } from "../settings-page";

const noopSubscribe = () => () => {};

/** Owners only, and only for this browser — see placeholder-preview-cookie.ts. */
export function PlaceholderPreviewToggle() {
  const router = useRouter();
  const saved = useSyncExternalStore(noopSubscribe, readPlaceholderPreview, () => null);
  const [override, setOverride] = useState<PlaceholderPreviewMode | "off" | null>(null);
  const [, startTransition] = useTransition();
  const value = override ?? saved ?? "off";
  const loadingStyle = useSyncExternalStore(subscribeLoadingStyle, readLoadingStyle, () => "loader" as const);
  return (
    <SettingsSection
      description="Temporary, for checking the loading screen (a blank page with a spinner). In this browser only — nobody else is affected. Hold keeps each page's loading screen up for 5 seconds before its content, so you can click into a notice or a walk and see it too. Always shows only the loading screen. Loading screen swaps the loader for the grey skeleton shapes in this browser, to compare them. To switch quickly, use the small Placeholders button at the bottom left of any page, or press Alt+P (Option+P on a Mac)."
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
      <div className="flex w-full flex-col gap-1.5">
        <Label htmlFor="loading-style">Loading screen (this browser)</Label>
        <Select onValueChange={(next) => setLoadingStyle(next as LoadingStyle)} value={loadingStyle}>
          <SelectTrigger className="w-full sm:w-[24rem]" id="loading-style">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="loader">Loader (blank page with the ∞ loader — everyone sees this)</SelectItem>
            <SelectItem value="skeletons">Skeletons (grey shapes of the page)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </SettingsSection>
  );
}
