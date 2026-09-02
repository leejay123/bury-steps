"use client";

import { useActionState, useRef } from "react";
import { useFormStatus } from "react-dom";
import { updateSiteLogo, type ActionResult } from "@/server/actions";
import { useActionToast } from "@/hooks/use-action-toast";
import { FormError } from "@/components/form-error";
import { ImageDropzone } from "@/components/image-dropzone";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SettingsSection } from "../settings-page";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} type="submit">
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
  useActionToast(state, () => formRef.current?.reset());

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
              aspect="video"
              clearable={hasCustomLogo}
              existingAlt="Current site logo"
              existingSrc={logoSrc}
              hint="JPEG, PNG or WebP, under 4 MB."
              id="logo-image"
            />
          </div>
        </div>
        <FormError message={state && !state.ok ? state.error : null} />
        <div className="flex flex-wrap gap-2">
          <Submit />
        </div>
      </form>
    </SettingsSection>
  );
}
