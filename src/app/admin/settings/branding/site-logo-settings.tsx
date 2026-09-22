"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { updateSiteLogo, type ActionResult } from "@/server/actions";
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

export function SiteLogoSettings({
  hasCustomLogo,
  logoSrc,
}: {
  hasCustomLogo: boolean;
  logoSrc: string;
}) {
  const [state, action] = useActionState<ActionResult | null, FormData>(updateSiteLogo, null);
  const formRef = useRef<HTMLFormElement>(null);
  const [dirty, setDirty] = useState(false);
  useActionToast(state, () => formRef.current?.reset());

  // A successful save lands here as a fresh `logoSrc` (Next re-renders this
  // route after the action's revalidatePath) — reset the dropzone (via its
  // key) and the dirty flag back to a clean slate for that new photo.
  useResetOnChange([logoSrc], () => setDirty(false));

  return (
    <SettingsSection
      description="Shown in the header and on printed accident reports. JPEG, PNG or WebP, under 4 MB — a wide banner shape works best."
      title="Site logo"
    >
      <form action={action} className="flex w-full flex-col gap-4" ref={formRef}>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="logo-image">Logo</Label>
          <div className="max-w-32">
            <ImageDropzone
              aspect="square"
              clearable={hasCustomLogo}
              existingAlt="Current site logo"
              existingSrc={logoSrc}
              hint="JPEG, PNG or WebP, under 4 MB."
              id="logo-image"
              key={logoSrc}
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
