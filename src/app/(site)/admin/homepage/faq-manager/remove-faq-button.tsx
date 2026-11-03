"use client";

import { useState } from "react";
import { deleteHomepageFaq } from "@/server/actions";
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
import { RemoveConfirm } from "./shared";

export function RemoveFaqButton({
  faqId,
  onRemoved,
  question,
}: {
  faqId: string;
  onRemoved: () => void;
  question: string;
}) {
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
        <Button size="xs" variant="destructive">
          Remove
        </Button>
      </AlertDialogTrigger>
      {open ? (
        <RemoveFaqDialogForm
          key={session}
          faqId={faqId}
          onClose={() => {
            setOpen(false);
            onRemoved();
          }}
          question={question}
        />
      ) : null}
    </AlertDialog>
  );
}

function RemoveFaqDialogForm({
  faqId,
  onClose,
  question,
}: {
  faqId: string;
  onClose: () => void;
  question: string;
}) {
  const [state, action, isPending] = useNotifyActionState(deleteHomepageFaq, onClose);

  return (
    <AlertDialogContent closeDisabled={isPending}>
      <form action={action} className="flex flex-col gap-4">
        <AlertDialogHeader>
          <AlertDialogTitle>Remove this FAQ?</AlertDialogTitle>
          <AlertDialogDescription>
            “{question}” will come off the public homepage.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <input name="faqId" type="hidden" value={faqId} />
        <FormError message={state && !state.ok ? state.error : null} />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending} type="button">
            Keep it
          </AlertDialogCancel>
          <RemoveConfirm />
        </AlertDialogFooter>
      </form>
    </AlertDialogContent>
  );
}
