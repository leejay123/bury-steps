"use client";

import { startTransition, useState, type FormEvent, type ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/form-error";
import { updateMyEmailPreferences } from "@/server/actions";
import { useActionToast } from "@/hooks/use-action-toast";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { useSafeActionState } from "@/hooks/use-safe-action-state";
import { SaveBar, useSaveBar } from "@/components/save-bar";
import { EMAIL_PREFERENCE_OPTIONS, type EmailPreferences } from "@/lib/email-preferences";

/** A heading strip in the list, as the History and Members lists' (DataListGroupHeader). */
function GroupHeader({ children }: { children: ReactNode }) {
  return (
    <p className="bg-muted/50 px-4 py-2.5 text-base font-medium">
      {children}
    </p>
  );
}

/** Same layout as the token-based form (email-preferences/[token]) but acts
 * on the signed-in user directly — no token field needed. */
export function MyEmailPreferencesForm({
  phone,
  ...prefs
}: EmailPreferences & {
  isAdmin: boolean;
  /** The phone alerts row, under its own heading at the end of the same list. */
  phone?: ReactNode;
}) {
  const [state, action, pending, clearError] = useSafeActionState(updateMyEmailPreferences);
  useActionToast(state);

  const options = EMAIL_PREFERENCE_OPTIONS.filter((option) => !option.adminOnly || prefs.isAdmin);
  // The boxes as ticked now; the save bar shows while they differ from what's saved.
  const saved = Object.fromEntries(options.map((option) => [option.name, prefs[option.name]]));
  const savedKey = JSON.stringify(saved);
  const [ticked, setTicked] = useState(saved);
  useResetOnChange([savedKey], () => setTicked(saved));
  const dirty = options.some((option) => ticked[option.name] !== saved[option.name]);
  const form = useSaveBar(dirty, pending, () => {
    setTicked(saved);
    clearError();
  });

  // Sent by hand, not <form action>: React resets a form after each action,
  // which flipped every box back to its old state until the saved values
  // came back from the server — it looked as if Save hadn't worked.
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => action(formData));
  }

  return (
    <>
      <form className="flex flex-col gap-5" onSubmit={submit} ref={form}>
        {/* One list, as the dashboard's others: Email and Phone each under a heading strip.
            Changes are saved from the save bar at the bottom. */}
        <div className="flex flex-col divide-y rounded-xl border" data-edge-list="" data-edge-top="">
          <GroupHeader>Email</GroupHeader>
          {options.map((option) => (
            <div className="flex items-start gap-3 px-4 py-3.5" key={option.name}>
              <Checkbox
                checked={ticked[option.name]}
                className="mt-0.5"
                id={option.name}
                name={option.name}
                onCheckedChange={(checked) => setTicked((now) => ({ ...now, [option.name]: checked === true }))}
              />
              <Label className="flex flex-col items-start gap-0.5 font-normal" htmlFor={option.name}>
                <span className="text-sm font-medium">{option.label}</span>
                <span className="text-sm text-muted-foreground">{option.hint}</span>
              </Label>
            </div>
          ))}
          {state && !state.ok ? (
            <div className="px-4 py-3.5">
              <FormError message={state.error} />
            </div>
          ) : null}
          {phone ? (
            <>
              <GroupHeader>Phone</GroupHeader>
              {phone}
            </>
          ) : null}
        </div>
      </form>
      <SaveBar />
    </>
  );
}
