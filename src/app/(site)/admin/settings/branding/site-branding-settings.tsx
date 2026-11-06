"use client";

import { useState } from "react";
import { updateSiteBranding } from "@/server/actions";
import { useActionToast } from "@/hooks/use-action-toast";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { useSafeActionState } from "@/hooks/use-safe-action-state";
import { FormError } from "@/components/form-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MAX_SITE_NAME, MAX_SITE_TAGLINE } from "@/lib/site-branding";
import { SettingsSection } from "../settings-page";
import { useSaveBar } from "@/components/save-bar";

export function SiteBrandingSettings({
  siteName,
  siteTagline,
}: {
  siteName: string;
  siteTagline: string;
}) {
  const [name, setName] = useState(siteName);
  const [tagline, setTagline] = useState(siteTagline);
  const [state, action, pending, clearError] = useSafeActionState(updateSiteBranding);
  useActionToast(state);

  useResetOnChange([siteName, siteTagline], () => {
    setName(siteName);
    setTagline(siteTagline);
  });

  const dirty = name !== siteName || tagline !== siteTagline;
  const form = useSaveBar(dirty, pending, () => {
    setName(siteName);
    setTagline(siteTagline);
    clearError();
  });

  return (
    <SettingsSection
      description="Used on browser tab titles, the logo’s name for screen readers, emails, the footer, and link previews when someone shares the site. The homepage heading is edited in Page designs."
      title="Site name and share line"
    >
      <form action={action} ref={form} className="flex w-full flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="siteName">Site name</Label>
          <Input
            id="siteName"
            maxLength={MAX_SITE_NAME}
            name="siteName"
            onChange={(event) => setName(event.target.value)}
            required
            value={name}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="siteTagline">Share preview line</Label>
          <Textarea
            id="siteTagline"
            maxLength={MAX_SITE_TAGLINE}
            name="siteTagline"
            onChange={(event) => setTagline(event.target.value)}
            required
            rows={3}
            value={tagline}
          />
          <p className="text-xs text-muted-foreground">
            Shown under the site name when someone shares a link. Keep it under about 160 characters so search and share cards use this line.
          </p>
        </div>
        <FormError message={state && !state.ok ? state.error : null} />
      </form>
    </SettingsSection>
  );
}
