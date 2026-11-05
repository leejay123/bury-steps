"use client";

import { useState } from "react";
import { updateSiteLogo } from "@/server/actions";
import { useActionToast } from "@/hooks/use-action-toast";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { useSafeActionState } from "@/hooks/use-safe-action-state";
import { FormError } from "@/components/form-error";
import { ImageDropzone } from "@/components/image-dropzone";
import { Label } from "@/components/ui/label";
import { useSaveBar } from "@/components/save-bar";
import { SettingsSection } from "../settings-page";

export function SiteLogoSettings({
  hasCustomLogo,
  logoSrc,
}: {
  hasCustomLogo: boolean;
  logoSrc: string;
}) {
  const [state, action, pending] = useSafeActionState(updateSiteLogo);
  const [dirty, setDirty] = useState(false);
  // Discard (save bar) starts the dropzone afresh, back to the saved picture.
  const [fresh, setFresh] = useState(0);
  const formRef = useSaveBar(dirty, pending, () => {
    setFresh((count) => count + 1);
    setDirty(false);
  });
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
              key={`${logoSrc}:${fresh}`}
              onDirtyChange={setDirty}
            />
          </div>
        </div>
        <FormError message={state && !state.ok ? state.error : null} />
      </form>
    </SettingsSection>
  );
}
