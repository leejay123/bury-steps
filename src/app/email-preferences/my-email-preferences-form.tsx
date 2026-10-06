"use client";

import { startTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/form-error";
import { updateMyEmailPreferences } from "@/server/actions";
import { useActionToast } from "@/hooks/use-action-toast";
import { useSafeActionState } from "@/hooks/use-safe-action-state";
import { EMAIL_PREFERENCE_OPTIONS, type EmailPreferences } from "@/lib/email-preferences";

function SaveButton({ pending }: { pending: boolean }) {
  return (
    <Button className="self-start" disabled={pending} type="submit">
      {pending ? "Saving…" : "Save preferences"}
    </Button>
  );
}

/** Same layout as the token-based form (email-preferences/[token]) but acts
 * on the signed-in user directly — no token field needed. */
export function MyEmailPreferencesForm(prefs: EmailPreferences & { isAdmin: boolean }) {
  const [state, action, pending] = useSafeActionState(updateMyEmailPreferences);
  useActionToast(state);
  // Sent by hand, not <form action>: React resets a form after each action,
  // which flipped every box back to its old state until the saved values
  // came back from the server — it looked as if Save hadn't worked.
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => action(formData));
  }

  const options = EMAIL_PREFERENCE_OPTIONS.filter((option) => !option.adminOnly || prefs.isAdmin);

  return (
    <form className="flex flex-col gap-5" onSubmit={submit}>
      <div className="flex flex-col divide-y rounded-xl border">
        {options.map((option) => (
          <div className="flex items-start gap-3 px-4 py-3.5" key={option.name}>
            <Checkbox
              className="mt-0.5"
              defaultChecked={prefs[option.name]}
              id={option.name}
              // Forces a remount when the saved value actually changes —
              // without this, the box stayed uncontrolled after a
              // successful save (router.refresh() passes a new
              // defaultChecked to the same mounted element, which React
              // never re-applies), so it kept showing whatever it looked
              // like right before Save until a full page reload.
              key={`${option.name}:${prefs[option.name]}`}
              name={option.name}
            />
            <Label className="flex flex-col items-start gap-0.5 font-normal" htmlFor={option.name}>
              <span className="text-sm font-medium">{option.label}</span>
              <span className="text-sm text-muted-foreground">{option.hint}</span>
            </Label>
          </div>
        ))}
      </div>
      <FormError message={state && !state.ok ? state.error : null} />
      <SaveButton pending={pending} />
    </form>
  );
}
