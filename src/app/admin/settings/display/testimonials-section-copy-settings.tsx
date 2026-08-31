"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { updateTestimonialsSectionCopy, type ActionResult } from "@/server/actions";
import { useActionToast } from "@/hooks/use-action-toast";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  MAX_TESTIMONIALS_SECTION_INTRO,
  MAX_TESTIMONIALS_SECTION_TITLE,
} from "@/lib/testimonials";
import { SettingsSection } from "../settings-page";

function Submit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button disabled={disabled || pending} type="submit">
      {pending ? "Saving…" : "Save"}
    </Button>
  );
}

export function TestimonialsSectionCopySettings({
  testimonialsSectionIntro,
  testimonialsSectionTitle,
}: {
  testimonialsSectionIntro: string;
  testimonialsSectionTitle: string;
}) {
  const [title, setTitle] = useState(testimonialsSectionTitle);
  const [intro, setIntro] = useState(testimonialsSectionIntro);
  const [state, action] = useActionState<ActionResult | null, FormData>(
    updateTestimonialsSectionCopy,
    null,
  );
  useActionToast(state);

  useEffect(() => {
    setTitle(testimonialsSectionTitle);
    setIntro(testimonialsSectionIntro);
  }, [testimonialsSectionTitle, testimonialsSectionIntro]);

  const dirty = title !== testimonialsSectionTitle || intro !== testimonialsSectionIntro;

  return (
    <SettingsSection
      description="Heading and short intro above the quote grid on the homepage."
      title="Testimonials"
    >
      <form action={action} className="flex max-w-lg flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="testimonialsSectionTitle">Heading</Label>
          <Input
            id="testimonialsSectionTitle"
            maxLength={MAX_TESTIMONIALS_SECTION_TITLE}
            name="testimonialsSectionTitle"
            onChange={(event) => setTitle(event.target.value)}
            required
            value={title}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="testimonialsSectionIntro">Intro</Label>
          <Textarea
            id="testimonialsSectionIntro"
            maxLength={MAX_TESTIMONIALS_SECTION_INTRO}
            name="testimonialsSectionIntro"
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
                setTitle(testimonialsSectionTitle);
                setIntro(testimonialsSectionIntro);
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
