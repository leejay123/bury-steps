"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { updateFacebookGroupUrl, type ActionResult } from "@/server/actions";
import { useActionToast } from "@/hooks/use-action-toast";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MAX_FACEBOOK_GROUP_URL } from "@/lib/site-branding";
import { SettingsSection } from "../settings-page";

function Submit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button disabled={disabled || pending} type="submit">
      {pending ? "Saving…" : "Save"}
    </Button>
  );
}

export function FacebookGroupSettings({ facebookGroupUrl }: { facebookGroupUrl: string }) {
  const [url, setUrl] = useState(facebookGroupUrl);
  const [state, action] = useActionState<ActionResult | null, FormData>(
    updateFacebookGroupUrl,
    null,
  );
  useActionToast(state);

  useResetOnChange([facebookGroupUrl], () => setUrl(facebookGroupUrl));

  const dirty = url !== facebookGroupUrl;

  return (
    <SettingsSection
      description="Shown in the site footer, FAQ empty state, and About drawer. Leave blank to hide Facebook links everywhere."
      title="Facebook group"
    >
      <form action={action} className="flex w-full flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="facebookGroupUrl">Group link</Label>
          <Input
            id="facebookGroupUrl"
            inputMode="url"
            maxLength={MAX_FACEBOOK_GROUP_URL}
            name="facebookGroupUrl"
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://www.facebook.com/groups/…"
            type="text"
            value={url}
          />
        </div>
        <FormError message={state && !state.ok ? state.error : null} />
        <div className="flex flex-wrap gap-2">
          <Submit disabled={!dirty} />
          {dirty ? (
            <Button onClick={() => setUrl(facebookGroupUrl)} type="button" variant="outline">
              Discard
            </Button>
          ) : null}
        </div>
      </form>
    </SettingsSection>
  );
}
