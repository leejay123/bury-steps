"use client";

import { useState } from "react";
import { updateWalkPageCopy } from "@/server/actions";
import { useNotifyActionState } from "@/hooks/use-action-toast";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MAX_ABOUT_LIST_ITEM, MAX_ABOUT_LIST_ITEMS, MAX_ABOUT_RULES } from "@/lib/homepage-copy";
import { SettingsSection } from "../settings-page";

/**
 * The two fixed cards shown on a walk's own share page (/w/[token]) — see
 * @/components/before-you-set-off and @/components/how-walks-work. Not
 * shown on the homepage.
 */
export function WalkPageCopySettings({
  beforeYouSetOffTipsText,
  howWalksWorkStepsText,
}: {
  beforeYouSetOffTipsText: string;
  howWalksWorkStepsText: string;
}) {
  const [tips, setTips] = useState(beforeYouSetOffTipsText);
  const [steps, setSteps] = useState(howWalksWorkStepsText);
  const [state, action, isPending] = useNotifyActionState(updateWalkPageCopy);

  useResetOnChange([beforeYouSetOffTipsText, howWalksWorkStepsText], () => {
    setTips(beforeYouSetOffTipsText);
    setSteps(howWalksWorkStepsText);
  });

  const dirty = tips !== beforeYouSetOffTipsText || steps !== howWalksWorkStepsText;

  return (
    <SettingsSection
      description="How this group works sits under the walk details. Before you set off shows while clock-in is still closed. Not shown on the homepage."
      title="Walk page cards"
    >
      <form action={action} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="before-you-set-off-tips">Before you set off</Label>
          <Textarea
            className="min-h-32 font-mono text-sm"
            id="before-you-set-off-tips"
            name="beforeYouSetOffTips"
            onChange={(event) => setTips(event.target.value)}
            required
            rows={6}
            value={tips}
          />
          <p className="text-xs text-muted-foreground">
            Up to {MAX_ABOUT_LIST_ITEMS} lines, one tip per line, each up to {MAX_ABOUT_LIST_ITEM}{" "}
            characters.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="how-walks-work-steps">How this group works</Label>
          <Textarea
            className="min-h-32 font-mono text-sm"
            id="how-walks-work-steps"
            name="howWalksWorkSteps"
            onChange={(event) => setSteps(event.target.value)}
            required
            rows={6}
            value={steps}
          />
          <p className="text-xs text-muted-foreground">
            Up to {MAX_ABOUT_RULES} lines as “Title | Body” — for example Create an account | Sign
            up with email or Google so we know who is on the walk.
          </p>
        </div>
        <FormError message={state && !state.ok ? state.error : null} />
        <div className="flex flex-wrap gap-2">
          <Button disabled={!dirty || isPending} type="submit">
            {isPending ? "Saving…" : "Save"}
          </Button>
          {dirty ? (
            <Button
              onClick={() => {
                setTips(beforeYouSetOffTipsText);
                setSteps(howWalksWorkStepsText);
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
