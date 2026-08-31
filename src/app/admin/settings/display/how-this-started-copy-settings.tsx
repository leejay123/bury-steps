"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { updateHowThisStartedCopy, type ActionResult } from "@/server/actions";
import { useActionToast } from "@/hooks/use-action-toast";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  MAX_HOW_THIS_STARTED_BODY,
  MAX_HOW_THIS_STARTED_EYEBROW,
  MAX_HOW_THIS_STARTED_TEASER,
  MAX_HOW_THIS_STARTED_TITLE,
} from "@/lib/homepage-copy";
import { SettingsSection } from "../settings-page";

function Submit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button disabled={disabled || pending} type="submit">
      {pending ? "Saving…" : "Save"}
    </Button>
  );
}

export function HowThisStartedCopySettings({
  howThisStartedBody,
  howThisStartedEyebrow,
  howThisStartedTeaser,
  howThisStartedTitle,
}: {
  howThisStartedBody: string;
  howThisStartedEyebrow: string;
  howThisStartedTeaser: string;
  howThisStartedTitle: string;
}) {
  const [title, setTitle] = useState(howThisStartedTitle);
  const [eyebrow, setEyebrow] = useState(howThisStartedEyebrow);
  const [teaser, setTeaser] = useState(howThisStartedTeaser);
  const [body, setBody] = useState(howThisStartedBody);
  const [state, action] = useActionState<ActionResult | null, FormData>(
    updateHowThisStartedCopy,
    null,
  );
  useActionToast(state);

  useEffect(() => {
    setTitle(howThisStartedTitle);
    setEyebrow(howThisStartedEyebrow);
    setTeaser(howThisStartedTeaser);
    setBody(howThisStartedBody);
  }, [howThisStartedTitle, howThisStartedEyebrow, howThisStartedTeaser, howThisStartedBody]);

  const dirty =
    title !== howThisStartedTitle ||
    eyebrow !== howThisStartedEyebrow ||
    teaser !== howThisStartedTeaser ||
    body !== howThisStartedBody;

  return (
    <SettingsSection
      description="Homepage blurb and the full story in the Read more drawer. Use a blank line between paragraphs in the full story."
      title="How this started"
    >
      <form action={action} className="flex max-w-2xl flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="howThisStartedTitle">Heading</Label>
          <Input
            id="howThisStartedTitle"
            maxLength={MAX_HOW_THIS_STARTED_TITLE}
            name="howThisStartedTitle"
            onChange={(event) => setTitle(event.target.value)}
            required
            value={title}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="howThisStartedEyebrow">Eyebrow (optional)</Label>
          <Input
            id="howThisStartedEyebrow"
            maxLength={MAX_HOW_THIS_STARTED_EYEBROW}
            name="howThisStartedEyebrow"
            onChange={(event) => setEyebrow(event.target.value)}
            value={eyebrow}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="howThisStartedTeaser">Homepage blurb</Label>
          <Textarea
            id="howThisStartedTeaser"
            maxLength={MAX_HOW_THIS_STARTED_TEASER}
            name="howThisStartedTeaser"
            onChange={(event) => setTeaser(event.target.value)}
            required
            rows={3}
            value={teaser}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="howThisStartedBody">Full story</Label>
          <Textarea
            className="min-h-64 font-mono text-sm"
            id="howThisStartedBody"
            maxLength={MAX_HOW_THIS_STARTED_BODY}
            name="howThisStartedBody"
            onChange={(event) => setBody(event.target.value)}
            required
            rows={16}
            value={body}
          />
        </div>
        <FormError message={state && !state.ok ? state.error : null} />
        <div className="flex flex-wrap gap-2">
          <Submit disabled={!dirty} />
          {dirty ? (
            <Button
              onClick={() => {
                setTitle(howThisStartedTitle);
                setEyebrow(howThisStartedEyebrow);
                setTeaser(howThisStartedTeaser);
                setBody(howThisStartedBody);
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
