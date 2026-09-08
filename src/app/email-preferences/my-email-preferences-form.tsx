"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/form-error";
import { updateMyEmailPreferences, type ActionResult } from "@/server/actions";
import { useActionToast } from "@/hooks/use-action-toast";
import { EMAIL_PREFERENCE_OPTIONS, type EmailPreferences } from "@/lib/email-preferences";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} type="submit">
      {pending ? "Saving…" : "Save preferences"}
    </Button>
  );
}

/** Same layout as the token-based form (email-preferences/[token]) but acts
 * on the signed-in user directly — no token field needed. */
export function MyEmailPreferencesForm(prefs: EmailPreferences) {
  const [state, action] = useActionState<ActionResult | null, FormData>(
    updateMyEmailPreferences,
    null,
  );
  useActionToast(state);

  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="flex flex-col gap-4">
        {EMAIL_PREFERENCE_OPTIONS.map((option) => (
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
