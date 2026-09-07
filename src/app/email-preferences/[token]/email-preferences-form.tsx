"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/form-error";
import { updateMemberEmailPreferences, type ActionResult } from "@/server/actions";
import { useActionToast } from "@/hooks/use-action-toast";

type Prefs = {
  emailWalkAnnouncements: boolean;
  emailNotices: boolean;
  emailProgress: boolean;
  emailNewsletter: boolean;
};

const OPTIONS: { name: keyof Prefs; label: string; hint: string }[] = [
  {
    name: "emailWalkAnnouncements",
    label: "Walk announcements",
    hint: "New walks, changes, and cancellations.",
  },
  { name: "emailNotices", label: "Notices", hint: "A digest when a new notice is posted." },
  { name: "emailProgress", label: "Progress", hint: "Your walk history and group goal updates." },
  { name: "emailNewsletter", label: "Newsletter", hint: "Occasional group news." },
];

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} type="submit">
      {pending ? "Saving…" : "Save preferences"}
    </Button>
  );
}

export function EmailPreferencesForm({ token, ...prefs }: Prefs & { token: string }) {
  const [state, action] = useActionState<ActionResult | null, FormData>(
    updateMemberEmailPreferences,
    null,
  );
  useActionToast(state);

  return (
    <form action={action} className="flex flex-col gap-5">
      <input name="token" type="hidden" value={token} />
      <div className="flex flex-col gap-4">
        {OPTIONS.map((option) => (
          <div className="flex items-start gap-3" key={option.name}>
            <Checkbox
              defaultChecked={prefs[option.name]}
              id={option.name}
              name={option.name}
            />
            <Label className="flex flex-col gap-0.5 font-normal" htmlFor={option.name}>
              <span className="text-sm font-medium">{option.label}</span>
              <span className="text-sm text-muted-foreground">{option.hint}</span>
            </Label>
          </div>
        ))}
      </div>
      <FormError message={state && !state.ok ? state.error : null} />
      <SaveButton />
    </form>
  );
}
