"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { setMemberRole, type ActionResult } from "@/server/actions";
import { preventDismissWhilePending, useActionToast } from "@/hooks/use-action-toast";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function Confirm({ promoting }: { promoting: boolean }) {
  const { pending } = useFormStatus();
  return (
    <AlertDialogAction disabled={pending} type="submit">
      {pending
        ? promoting
          ? "Promoting…"
          : "Demoting…"
        : promoting
          ? "Make organiser"
          : "Make member"}
    </AlertDialogAction>
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
  useActionToast(state, () => setOpen(false));

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
                    manage walks.
                  </p>
                  <p>You can change them back to a member later.</p>
                </>
              ) : (
                <>
                  <p>
                    They will lose organiser tools and keep their member account, walk history, and
                    clock-ins.
                  </p>
                  <p>There must still be at least one organiser left in the group.</p>
                </>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form action={action}>
          <input name="userId" type="hidden" value={userId} />
          <input name="role" type="hidden" value={nextRole} />
          <FormError message={state && !state.ok ? state.error : null} />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending} type="button">
              Cancel
            </AlertDialogCancel>
            <Confirm promoting={promoting} />
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
