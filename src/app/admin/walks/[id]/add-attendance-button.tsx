"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { adminClockIn, type ActionResult } from "@/server/actions";
import { preventDismissWhilePending, useActionToast } from "@/hooks/use-action-toast";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

function Confirm({ walkCompleted }: { walkCompleted: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} type="submit">
      {pending ? "Adding…" : walkCompleted ? "Add to this walk" : "Clock them in"}
    </Button>
  );
}

export function AddAttendanceButton({
  members,
  walkCompleted,
  walkId,
}: {
  members: { id: string; label: string }[];
  walkCompleted: boolean;
  walkId: string;
}) {
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    adminClockIn,
    null,
  );
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  useActionToast(state, () => setOpen(false));

  const empty = members.length === 0;
  const needle = query.trim().toLowerCase();
  const visible = needle
    ? members.filter((member) => member.label.toLowerCase().includes(needle))
    : members;

  return (
    <AlertDialog
      closeDisabled={isPending}
      onOpenChange={(next) => {
        preventDismissWhilePending(isPending, setOpen)(next);
        if (!next) setQuery("");
      }}
      open={open}
    >
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline">
          Add someone
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent closeDisabled={isPending}>
        <form action={action} className="flex flex-col gap-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Add someone who was there?</AlertDialogTitle>
            <AlertDialogDescription>
              {walkCompleted
                ? "Use this when they walked with you but missed clock-in, or could not sign in before the window closed. They need an account. They will show as attending from the start, with no health notes."
                : "Use this when they are on the walk but their phone died, or they cannot clock in themselves. They need an account. Clock-in time is recorded now, with no health notes."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input name="walkId" type="hidden" value={walkId} />
          {empty ? (
            <p className="text-sm text-muted-foreground">
              Everyone with an account is already on this walk’s list.
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`add-member-${walkId}`} required>
                Member
              </Label>
              {members.length > 8 ? (
                <Input
                  aria-label="Search members"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by name or email"
                  value={query}
                />
              ) : null}
              {visible.length === 0 ? (
                <p className="text-sm text-muted-foreground">No matching members.</p>
              ) : (
                <Select name="userId" required>
                  <SelectTrigger id={`add-member-${walkId}`}>
                    <SelectValue placeholder="Choose who to add" />
                  </SelectTrigger>
                  <SelectContent>
                    {visible.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
          <FormError message={state && !state.ok ? state.error : null} />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending} type="button">
              Don’t add
            </AlertDialogCancel>
            {empty || visible.length === 0 ? null : <Confirm walkCompleted={walkCompleted} />}
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
