"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { updateFaqSectionCopy, type ActionResult } from "@/server/actions";
import { useActionToast } from "@/hooks/use-action-toast";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MAX_FAQ_SECTION_INTRO, MAX_FAQ_SECTION_TITLE } from "@/lib/faqs";
import { SettingsSection } from "../settings-page";

function Submit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button disabled={disabled || pending} type="submit">
      {pending ? "Saving…" : "Save"}
    </Button>
  );
}

export function FaqSectionCopySettings({
  faqSectionIntro,
  faqSectionTitle,
}: {
  faqSectionIntro: string;
  faqSectionTitle: string;
}) {
  const [title, setTitle] = useState(faqSectionTitle);
  const [intro, setIntro] = useState(faqSectionIntro);
  const [state, action] = useActionState<ActionResult | null, FormData>(
    updateFaqSectionCopy,
    null,
  );
  useActionToast(state);

  useResetOnChange([faqSectionTitle, faqSectionIntro], () => {
    setTitle(faqSectionTitle);
    setIntro(faqSectionIntro);
  });

  const dirty = title !== faqSectionTitle || intro !== faqSectionIntro;

  return (
    <SettingsSection
      description="Heading and short intro above the question list on the homepage."
      title="FAQs"
    >
      <form action={action} className="flex w-full flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="faqSectionTitle">Heading</Label>
          <Input
            id="faqSectionTitle"
            maxLength={MAX_FAQ_SECTION_TITLE}
            name="faqSectionTitle"
            onChange={(event) => setTitle(event.target.value)}
            required
            value={title}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="faqSectionIntro">Intro</Label>
          <Textarea
            id="faqSectionIntro"
            maxLength={MAX_FAQ_SECTION_INTRO}
            name="faqSectionIntro"
            onChange={(event) => setIntro(event.target.value)}
            required
            rows={3}
            value={intro}
          />
        </div>
        <FormError message={state && !state.ok ? state.error : null} />
        <div className="flex flex-wrap gap-2">
          <Submit disabled={!dirty} />
          {dirty ? (
            <Button
              onClick={() => {
                setTitle(faqSectionTitle);
                setIntro(faqSectionIntro);
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
