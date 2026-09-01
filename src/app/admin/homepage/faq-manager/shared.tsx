"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function PendingSubmit({
  label,
  pendingLabel,
  disabled,
}: {
  label: string;
  pendingLabel: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending || disabled} type="submit">
      {pending ? pendingLabel : label}
    </Button>
  );
}

/** Shared destructive submit button for the FAQ and category remove dialogs. */
export function RemoveConfirm({ label = "Remove" }: { label?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} type="submit" variant="destructive">
      {pending ? "Removing…" : label}
    </Button>
  );
}
