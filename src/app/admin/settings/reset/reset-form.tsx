"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { resetSiteToDefault, type ActionResult } from "@/server/actions";
import { preventDismissWhilePending, useActionToast } from "@/hooks/use-action-toast";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RESET_CONFIRM_WORD, isResetConfirmWord } from "@/lib/site-reset";
import { SettingsSection } from "../settings-page";

function ConfirmReset({ enabled }: { enabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      className="bg-destructive text-white hover:bg-destructive/90"
      disabled={!enabled || pending}
      type="submit"
    >
      {pending ? "Resetting…" : "Reset the site"}
    </Button>
  );
}

export function ResetSiteForm() {
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    resetSiteToDefault,
    null,
  );
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  useActionToast(state, () => {
    setOpen(false);
    setConfirm("");
  });

  return (
    <SettingsSection
      description="Deletes every walk, clock-in, member, report, notice, and homepage edit. Puts the starter photos, quotes, and FAQs back. You stay the organiser."
      title="Reset to a blank group"
      tone="danger"
    >
      <AlertDialog
        closeDisabled={isPending}
        onOpenChange={(next) => {
          preventDismissWhilePending(isPending, setOpen)(next);
          if (!next) setConfirm("");
        }}
        open={open}
      >
        <AlertDialogTrigger asChild>
          <Button className="w-full sm:w-auto" type="button" variant="destructive">
            Reset the site
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent closeDisabled={isPending}>
          <form action={action} className="flex flex-col gap-4">
            <AlertDialogHeader>
              <AlertDialogTitle>Reset the whole site?</AlertDialogTitle>
              <AlertDialogDescription>
                This cannot be undone. Walks, members, reports, and homepage content will go. You
                will still be the organiser. Type {RESET_CONFIRM_WORD} to continue.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex flex-col gap-2">
              <Label htmlFor="reset-confirm" required>
                Type {RESET_CONFIRM_WORD}
              </Label>
              <Input
                autoComplete="off"
                id="reset-confirm"
                name="confirm"
                onChange={(event) => setConfirm(event.target.value)}
                value={confirm}
              />
            </div>
            <FormError message={state && !state.ok ? state.error : null} />
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending} type="button">
                Keep everything
              </AlertDialogCancel>
              <ConfirmReset enabled={isResetConfirmWord(confirm)} />
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </SettingsSection>
  );
}
