"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { updateHomepageSectionEnabled, type ActionResult } from "@/server/actions";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { SettingsSection } from "../settings-page";

type SectionKey =
  | "testimonialsEnabled"
  | "faqsEnabled"
  | "howWalksWorkEnabled"
  | "howThisStartedEnabled"
  | "memberNoticesEnabled";

function SectionToggle({
  description,
  enabled,
  formKey,
  label,
}: {
  description: string;
  enabled: boolean;
  formKey: SectionKey;
  label: string;
}) {
  const [on, setOn] = useState(enabled);
  const [state, dispatch, isPending] = useActionState<ActionResult | null, FormData>(
    updateHomepageSectionEnabled,
    null,
  );

  useEffect(() => setOn(enabled), [enabled]);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      if (state.message) toast.success(state.message);
    } else {
      setOn(enabled);
      toast.error(state.error);
    }
  }, [state, enabled]);

  function toggle(next: boolean) {
    if (next === on) return;
    setOn(next);
    const formData = new FormData();
    formData.set("section", formKey);
    formData.set(formKey, next ? "on" : "");
    startTransition(() => {
      dispatch(formData);
    });
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/30 px-4 py-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <Label className="font-medium" htmlFor={formKey}>
          {label}
        </Label>
        <span className="text-xs text-muted-foreground">{description}</span>
        {isPending ? <span className="text-xs text-muted-foreground">Saving…</span> : null}
      </div>
      <Checkbox
        checked={on}
        disabled={isPending}
        id={formKey}
        onCheckedChange={(value) => toggle(value === true)}
      />
    </div>
  );
}

export function HomepageSectionsSettings({
  faqsEnabled,
  howThisStartedEnabled,
  howWalksWorkEnabled,
  memberNoticesEnabled,
  testimonialsEnabled,
}: {
  faqsEnabled: boolean;
  howThisStartedEnabled: boolean;
  howWalksWorkEnabled: boolean;
  memberNoticesEnabled: boolean;
  testimonialsEnabled: boolean;
}) {
  return (
    <SettingsSection
      description="Turn whole blocks on or off. Headings and blurbs are edited below; questions and quotes still live under FAQs and Testimonials."
      title="Homepage sections"
    >
      <div className="flex flex-col gap-3">
        <SectionToggle
          description="The three-step strip on the homepage, and “How this group works” on walk share links."
          enabled={howWalksWorkEnabled}
          formKey="howWalksWorkEnabled"
          label="How walks work"
        />
        <SectionToggle
          description="Homepage story blurb and Read more drawer."
          enabled={howThisStartedEnabled}
          formKey="howThisStartedEnabled"
          label="How this started"
        />
        <SectionToggle
          description="Latest notices carousel for signed-in members only."
          enabled={memberNoticesEnabled}
          formKey="memberNoticesEnabled"
          label="Member notices"
        />
        <SectionToggle
          description="Quotes on the public homepage."
          enabled={testimonialsEnabled}
          formKey="testimonialsEnabled"
          label="Testimonials"
        />
        <SectionToggle
          description="Questions and answers on the public homepage."
          enabled={faqsEnabled}
          formKey="faqsEnabled"
          label="FAQs"
        />
      </div>
    </SettingsSection>
  );
}
