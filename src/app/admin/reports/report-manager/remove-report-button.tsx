"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Trash2 } from "lucide-react";
import { deleteAccidentReport } from "@/server/actions";
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

function RemoveReportConfirm() {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} type="submit" variant="destructive">
      {pending ? "Removing…" : "Remove"}
    </Button>
  );
}

export function RemoveButton({ reportId, title }: { reportId: string; title: string }) {
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
        <Button aria-label={`Remove report from ${title}`} size="xs" variant="destructive">
          <Trash2 data-icon="inline-start" />
          Remove
        </Button>
      </AlertDialogTrigger>
      {open ? (
        <RemoveReportDialogForm
          key={session}
          onClose={() => setOpen(false)}
          reportId={reportId}
          title={title}
        />
      ) : null}
    </AlertDialog>
  );
}

function RemoveReportDialogForm({
  onClose,
  reportId,
  title,
}: {
  onClose: () => void;
  reportId: string;
  title: string;
}) {
  const [state, action, isPending] = useNotifyActionState(deleteAccidentReport, onClose);

  return (
    <AlertDialogContent closeDisabled={isPending}>
      <form action={action}>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove this report?</AlertDialogTitle>
          <AlertDialogDescription>
            {title} will be deleted. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <input name="reportId" type="hidden" value={reportId} />
        <FormError message={state && !state.ok ? state.error : null} />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending} type="button">
            Keep it
          </AlertDialogCancel>
          <RemoveReportConfirm />
        </AlertDialogFooter>
      </form>
    </AlertDialogContent>
  );
}
