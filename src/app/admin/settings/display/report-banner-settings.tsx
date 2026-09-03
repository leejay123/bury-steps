"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { updateReportBanner, type ActionResult } from "@/server/actions";
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

export function ReportBannerSettings({ reportBannerSrc }: { reportBannerSrc: string | null }) {
  const [state, action] = useActionState<ActionResult | null, FormData>(updateReportBanner, null);
  const formRef = useRef<HTMLFormElement>(null);
  const [dirty, setDirty] = useState(false);
  useActionToast(state, () => formRef.current?.reset());

  // A successful save lands here as a fresh `reportBannerSrc` — reset the
  // dropzone (via its key) and the dirty flag back to a clean slate.
  useResetOnChange([reportBannerSrc], () => setDirty(false));

  return (
    <SettingsSection
      description="A wide letterhead-style image shown across the foot of every printed accident report. Separate from the site logo — leave it unset to print with no banner. JPEG, PNG or WebP, under 4 MB."
      title="Report banner"
    >
      <form action={action} className="flex w-full flex-col gap-4" ref={formRef}>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="report-banner-image">Banner</Label>
          <div className="max-w-xs">
            <ImageDropzone
              aspect="video"
              clearable={Boolean(reportBannerSrc)}
              existingAlt="Current report banner"
              existingSrc={reportBannerSrc ?? undefined}
              hint="JPEG, PNG or WebP, under 4 MB. Wide banner shape works best."
              id="report-banner-image"
              key={reportBannerSrc}
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
