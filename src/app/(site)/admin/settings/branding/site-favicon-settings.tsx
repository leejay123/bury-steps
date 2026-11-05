"use client";

import { useState } from "react";
import { updateSiteFavicon } from "@/server/actions";
import { useActionToast } from "@/hooks/use-action-toast";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { useSafeActionState } from "@/hooks/use-safe-action-state";
import { FormError } from "@/components/form-error";
import { ImageDropzone } from "@/components/image-dropzone";
import { Label } from "@/components/ui/label";
import { useSaveBar } from "@/components/save-bar";
import { SettingsSection } from "../settings-page";

export function SiteFaviconSettings({
  faviconSrc,
  hasCustomFavicon,
}: {
  faviconSrc: string;
  hasCustomFavicon: boolean;
}) {
  const [state, action, pending] = useSafeActionState(updateSiteFavicon);
  const [dirty, setDirty] = useState(false);
  // Discard (save bar) starts the dropzone afresh, back to the saved picture.
  const [fresh, setFresh] = useState(0);
  const formRef = useSaveBar(dirty, pending, () => {
    setFresh((count) => count + 1);
    setDirty(false);
  });
  useActionToast(state, () => formRef.current?.reset());

  // A successful save lands here as a fresh `faviconSrc` (Next re-renders
  // this route after the action's revalidatePath) — reset the dropzone (via
  // its key) and the dirty flag back to a clean slate for that new photo.
  useResetOnChange([faviconSrc], () => setDirty(false));

  return (
    <SettingsSection
      description="The browser tab icon. Most browsers shrink it a lot, so keep it simple. Some browsers cache tab icons, so it may take a hard refresh or a while to show up."
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
              hint="JPEG, PNG or WebP, under 4 MB. Must be square — equal width and height."
              id="favicon-image"
              key={`${faviconSrc}:${fresh}`}
              onDirtyChange={setDirty}
            />
          </div>
        </div>
        <FormError message={state && !state.ok ? state.error : null} />
      </form>
    </SettingsSection>
  );
}
