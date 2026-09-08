"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Trash2 } from "lucide-react";
import { removeNewsletterSubscriber } from "@/server/actions";
import { useNotifyActionState } from "@/hooks/use-action-toast";
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

function Confirm() {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} type="submit" variant="destructive">
      {pending ? "Removing…" : "Remove"}
    </Button>
  );
}

function RemoveSubscriberDialogForm({
  id,
  email,
  onClose,
}: {
  id: string;
  email: string;
  onClose: () => void;
}) {
  const [state, action, isPending] = useNotifyActionState(removeNewsletterSubscriber, onClose);

  return (
    <AlertDialogContent closeDisabled={isPending}>
      <form action={action} className="flex flex-col gap-4">
        <AlertDialogHeader>
          <AlertDialogTitle>Remove {email}?</AlertDialogTitle>
          <AlertDialogDescription>
            They stop getting the newsletter and are removed from the Resend audience. If this was
            a mistake, they can subscribe again from the footer form.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <input name="id" type="hidden" value={id} />
        <FormError message={state && !state.ok ? state.error : null} />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending} type="button">
            Keep them
          </AlertDialogCancel>
          <Confirm />
        </AlertDialogFooter>
      </form>
    </AlertDialogContent>
  );
}

/** Footer-form subscribers only — a member's newsletter toggle lives on
 * their own account (email preferences), not here. */
export function RemoveSubscriberButton({ id, email }: { id: string; email: string }) {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(0);

  return (
    <AlertDialog
      onOpenChange={(next) => {
        if (next) setSession((value) => value + 1);
        setOpen(next);
      }}
      open={open}
    >
      <AlertDialogTrigger asChild>
        <Button aria-label={`Remove ${email}`} size="xs" variant="ghost">
          <Trash2 data-icon="inline-start" />
          Remove
        </Button>
      </AlertDialogTrigger>
      {open ? (
        <RemoveSubscriberDialogForm email={email} id={id} key={session} onClose={() => setOpen(false)} />
      ) : null}
    </AlertDialog>
  );
}
