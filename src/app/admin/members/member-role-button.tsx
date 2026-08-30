"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { setMemberRole, type ActionResult } from "@/server/actions";
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

/** Must type this word to confirm a role change — same idea as site reset. */
export const ROLE_CONFIRM_WORD = "Confirm";

function ConfirmSubmit({
  confirmValue,
  promoting,
}: {
  confirmValue: string;
  promoting: boolean;
}) {
  const { pending } = useFormStatus();
  const ready = confirmValue.trim().toLowerCase() === ROLE_CONFIRM_WORD.toLowerCase();
  return (
    <Button disabled={pending || !ready} type="submit">
      {pending
        ? promoting
          ? "Promoting…"
          : "Demoting…"
        : promoting
          ? "Make organiser"
          : "Make member"}
    </Button>
  );
}

export function MemberRoleButton({
  name,
  role,
  userId,
}: {
  name: string;
  role: "ADMIN" | "MEMBER";
  userId: string;
}) {
  const promoting = role === "MEMBER";
  const nextRole = promoting ? "ADMIN" : "MEMBER";
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    setMemberRole,
    null,
  );
  const [open, setOpen] = useState(false);
  const [confirmValue, setConfirmValue] = useState("");
  useActionToast(state, () => setOpen(false));

  useEffect(() => {
    if (!open) setConfirmValue("");
  }, [open]);

  return (
    <AlertDialog
      closeDisabled={isPending}
      onOpenChange={preventDismissWhilePending(isPending, setOpen)}
      open={open}
    >
      <AlertDialogTrigger asChild>
        <Button size="xs" variant="outline">
          {promoting ? "Make organiser" : "Make member"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent closeDisabled={isPending}>
        {/*
          Use a normal submit Button — not AlertDialogAction. Radix Action
          closes the dialog on click, which unmounts the form before the
          server action can settle, so the role never appeared to change.
        */}
        <form action={action} className="flex flex-col gap-4">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {promoting ? `Make ${name} an organiser?` : `Make ${name} a member?`}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                {promoting ? (
                  <>
                    <p>
                      They will see Members, Reports, Settings, and this Guide, and can create and
                      manage walks — including other people’s data.
                    </p>
                    <p>You can change them back to a member later.</p>
                  </>
                ) : (
                  <>
                    <p>
                      They will lose organiser tools and keep their member account, walk history,
                      and clock-ins.
                    </p>
                    <p>There must still be at least one organiser left in the group.</p>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input name="userId" type="hidden" value={userId} />
          <input name="role" type="hidden" value={nextRole} />
          <input name="confirm" type="hidden" value={confirmValue} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`role-confirm-${userId}`}>
              Type &ldquo;{ROLE_CONFIRM_WORD}&rdquo; to continue
            </Label>
            <Input
              autoComplete="off"
              disabled={isPending}
              id={`role-confirm-${userId}`}
              onChange={(event) => setConfirmValue(event.target.value)}
              placeholder={ROLE_CONFIRM_WORD}
              spellCheck={false}
              value={confirmValue}
            />
          </div>
          <FormError message={state && !state.ok ? state.error : null} />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending} type="button">
              Cancel
            </AlertDialogCancel>
            <ConfirmSubmit confirmValue={confirmValue} promoting={promoting} />
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
