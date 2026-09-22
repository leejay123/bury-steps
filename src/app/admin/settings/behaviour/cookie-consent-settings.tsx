"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateCookieConsentVariant, type ActionResult } from "@/server/actions";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import {
  COOKIE_CONSENT_VARIANTS,
  cookieConsentVariantLabel,
  type CookieConsentVariant,
} from "@/lib/cookie-consent-variant";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SettingsSection } from "../settings-page";

export function CookieConsentSettings({ variant }: { variant: CookieConsentVariant }) {
  const [selected, setSelected] = useState(variant);
  const [state, dispatch, isPending] = useActionState<ActionResult | null, FormData>(
    updateCookieConsentVariant,
    null,
  );

  useResetOnChange([variant], () => setSelected(variant));

  // The select already flipped optimistically when tapped — put it back so
  // the UI doesn't keep claiming a value the save never reached.
  useResetOnChange([state, variant], () => {
    if (state && !state.ok) setSelected(variant);
  });

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      if (state.message) toast.success(state.message);
    } else {
      toast.error(state.error);
    }
  }, [state, variant]);

  function onVariantChange(next: CookieConsentVariant) {
    if (next === selected) return;
    setSelected(next);
    const formData = new FormData();
    formData.set("cookieConsentVariant", next);
    startTransition(() => {
      dispatch(formData);
    });
  }

  return (
    <SettingsSection
      description="First-time visitors see this at the bottom of the screen until they choose Accept or Decline. The choice is remembered for a year."
      title="Cookie notice"
    >
      <div className="flex w-full flex-col gap-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="cookie-consent-variant">Layout</Label>
          {isPending ? (
            <Loader2 aria-label="Saving" className="size-3.5 animate-spin text-muted-foreground" role="status" />
          ) : null}
        </div>
        <Select
          disabled={isPending}
          onValueChange={(value) => onVariantChange(value as CookieConsentVariant)}
          value={selected}
        >
          <SelectTrigger className="w-full" id="cookie-consent-variant">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COOKIE_CONSENT_VARIANTS.map((item) => (
              <SelectItem key={item} value={item}>
                {cookieConsentVariantLabel(item)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          To preview on the live site after saving, clear the <code>cookieConsent</code> cookie in
          your browser, or use a private window.
        </p>
      </div>
    </SettingsSection>
  );
}
