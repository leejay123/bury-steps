"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { LogIn } from "lucide-react";
import { startImpersonation, type ActionResult } from "@/server/actions";
import { preventDismissWhilePending, useActionToast } from "@/hooks/use-action-toast";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
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

function ConfirmSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} type="submit">
      {pending ? "Signing in…" : "Log in as this member"}
    </Button>
  );
}

/** Members only — MemberDetailPage never renders this for an organiser row. */
export function ImpersonateButton({ name, userId }: { name: string; userId: string }) {
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    startImpersonation,
    null,
  );
  const [open, setOpen] = useState(false);
  useActionToast(state, () => setOpen(false));

  return (
    <AlertDialog closeDisabled={isPending} onOpenChange={preventDismissWhilePending(isPending, setOpen)} open={open}>
      <AlertDialogTrigger asChild>
        <Button size="xs" variant="outline">
          <LogIn data-icon="inline-start" />
          Log in as
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent closeDisabled={isPending}>
        <form action={action} className="flex flex-col gap-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Log in as {name}?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  You&apos;ll be signed in as {name} in this browser, exactly as they see the site.
                  A banner stays on screen the whole time with a one-click way back to your own
                  account, and this is recorded in the sign-in log.
                </p>
                <p>{name} is not notified.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input name="targetId" type="hidden" value={userId} />
          <FormError message={state && !state.ok ? state.error : null} />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending} type="button">
              Cancel
            </AlertDialogCancel>
            <ConfirmSubmit />
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
