"use client";

import { useState } from "react";
import { deleteSiteNotice } from "@/server/actions";
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

export function RemoveNoticeButton({
  noticeId,
  onRemoved,
  title,
}: {
  noticeId: string;
  onRemoved: () => void;
  title: string;
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
        <RemoveNoticeDialogForm
          key={session}
          noticeId={noticeId}
          onClose={() => {
            setOpen(false);
            onRemoved();
          }}
          title={title}
        />
      ) : null}
    </AlertDialog>
  );
}

function RemoveNoticeDialogForm({
  noticeId,
  onClose,
  title,
}: {
  noticeId: string;
  onClose: () => void;
  title: string;
}) {
  const [state, action, isPending] = useNotifyActionState(deleteSiteNotice, onClose);

  return (
    <AlertDialogContent closeDisabled={isPending}>
      <form action={action} className="flex flex-col gap-4">
        <AlertDialogHeader>
          <AlertDialogTitle>Remove this notice?</AlertDialogTitle>
          <AlertDialogDescription>
            “{title}” will come off the bell for everyone, and off the Notices page if it was a
            full-page notice.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <input name="noticeId" type="hidden" value={noticeId} />
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
