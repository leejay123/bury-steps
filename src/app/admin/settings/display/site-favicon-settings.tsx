"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { updateSiteFavicon, type ActionResult } from "@/server/actions";
import { useActionToast } from "@/hooks/use-action-toast";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { FormError } from "@/components/form-error";
import { ImageDropzone } from "@/components/image-dropzone";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SettingsSection } from "../settings-page";

function Submit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button disabled={disabled || pending} type="submit">
      {pending ? "Saving…" : "Save"}
    </Button>
  );
}

export function SiteFaviconSettings({
  faviconSrc,
  hasCustomFavicon,
}: {
  faviconSrc: string;
  hasCustomFavicon: boolean;
}) {
  const [state, action] = useActionState<ActionResult | null, FormData>(updateSiteFavicon, null);
  const formRef = useRef<HTMLFormElement>(null);
  const [dirty, setDirty] = useState(false);
  useActionToast(state, () => formRef.current?.reset());

  // A successful save lands here as a fresh `faviconSrc` (Next re-renders
  // this route after the action's revalidatePath) — reset the dropzone (via
  // its key) and the dirty flag back to a clean slate for that new photo.
  useResetOnChange([faviconSrc], () => setDirty(false));

  return (
    <SettingsSection
      description="The browser tab icon. A simple square image works best — most browsers shrink it a lot. Some browsers cache tab icons, so it may take a hard refresh or a while to show up."
      title="Favicon"
    >
      <form action={action} className="flex w-full flex-col gap-4" ref={formRef}>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="favicon-image">Favicon</Label>
          <div className="max-w-32">
            <ImageDropzone
              aspect="square"
              clearable={hasCustomFavicon}
              existingAlt="Current favicon"
              existingSrc={faviconSrc}
              hint="JPEG, PNG or WebP, under 4 MB."
              id="favicon-image"
              key={faviconSrc}
              onDirtyChange={setDirty}
            />
          </div>
        </div>
        <FormError message={state && !state.ok ? state.error : null} />
        <div className="flex flex-wrap gap-2">
          <Submit disabled={!dirty} />
        </div>
      </form>
    </SettingsSection>
  );
}
