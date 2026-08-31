"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { updateSiteBranding, type ActionResult } from "@/server/actions";
import { useActionToast } from "@/hooks/use-action-toast";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MAX_SITE_NAME, MAX_SITE_TAGLINE } from "@/lib/site-branding";
import { SettingsSection } from "../settings-page";

function Submit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button disabled={disabled || pending} type="submit">
      {pending ? "Saving…" : "Save"}
    </Button>
  );
}

export function SiteBrandingSettings({
  siteName,
  siteTagline,
}: {
  siteName: string;
  siteTagline: string;
}) {
  const [name, setName] = useState(siteName);
  const [tagline, setTagline] = useState(siteTagline);
  const [state, action] = useActionState<ActionResult | null, FormData>(updateSiteBranding, null);
  useActionToast(state);

  useEffect(() => {
    setName(siteName);
    setTagline(siteTagline);
  }, [siteName, siteTagline]);

  const dirty = name !== siteName || tagline !== siteTagline;

  return (
    <SettingsSection
      description="Used on the homepage hero, the logo’s name for screen readers, browser tab titles, and link previews when someone shares the site."
      title="Site name and tagline"
    >
      <form action={action} className="flex max-w-lg flex-col gap-4">
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
          <Label htmlFor="siteTagline">Homepage tagline</Label>
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
            Keep it under about 160 characters if you want the same line in share previews.
          </p>
        </div>
        <FormError message={state && !state.ok ? state.error : null} />
        <div className="flex flex-wrap gap-2">
          <Submit disabled={!dirty} />
          {dirty ? (
            <Button
              onClick={() => {
                setName(siteName);
                setTagline(siteTagline);
              }}
              type="button"
              variant="outline"
            >
              Discard
            </Button>
          ) : null}
        </div>
      </form>
    </SettingsSection>
  );
}
