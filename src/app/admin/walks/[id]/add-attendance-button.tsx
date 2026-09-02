"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { UserPlus } from "lucide-react";
import { adminClockIn, searchAddableMembers, type ActionResult } from "@/server/actions";
import { useActionToast } from "@/hooks/use-action-toast";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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

function AddAttendanceDialogForm({
  onClose,
  walkCompleted,
  walkId,
}: {
  onClose: () => void;
  walkCompleted: boolean;
  walkId: string;
}) {
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    adminClockIn,
    null,
  );
  const [query, setQuery] = useState("");
  const [members, setMembers] = useState<{ id: string; label: string }[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [searching, startSearch] = useTransition();
  useActionToast(state, onClose);

  useEffect(() => {
    let cancelled = false;
    const handle = window.setTimeout(() => {
      startSearch(async () => {
        const next = await searchAddableMembers(walkId, query);
        if (cancelled) return;
        setMembers(next);
        setLoaded(true);
        setSelectedUserId((prev) => (prev && next.some((m) => m.id === prev) ? prev : ""));
      });
    }, query.trim() ? 200 : 0);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [query, walkId]);

  const empty = loaded && members.length === 0 && !query.trim();
  const noMatch = loaded && members.length === 0 && Boolean(query.trim());

  return (
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
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`add-member-search-${walkId}`}>Search members</Label>
              <Input
                aria-label="Search members"
                id={`add-member-search-${walkId}`}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Type a name or email"
                value={query}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor={`add-member-${walkId}`} required>
                  Member
                </Label>
                {searching ? (
                  <p className="text-xs text-muted-foreground">Updating…</p>
                ) : null}
              </div>
              {!loaded ? (
                <Skeleton aria-label="Looking up members…" className="h-9 w-full" role="status" />
              ) : noMatch ? (
                <p className="text-sm text-muted-foreground">No matching members.</p>
              ) : (
                <Select
                  name="userId"
                  onValueChange={setSelectedUserId}
                  required
                  value={selectedUserId || undefined}
                >
                  <SelectTrigger id={`add-member-${walkId}`}>
                    <SelectValue placeholder="Choose who to add" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {loaded && members.length >= 40 ? (
                <p className="text-xs text-muted-foreground">
                  Showing the first 40 matches. Type more of the name to narrow it down.
                </p>
              ) : null}
            </div>
          </div>
        )}
        <FormError message={state && !state.ok ? state.error : null} />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending} type="button">
            Don’t add
          </AlertDialogCancel>
          {empty || noMatch || !loaded || !selectedUserId ? null : (
            <Confirm walkCompleted={walkCompleted} />
          )}
        </AlertDialogFooter>
      </form>
    </AlertDialogContent>
  );
}

export function AddAttendanceButton({
  walkCompleted,
  walkId,
}: {
  walkCompleted: boolean;
  walkId: string;
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
        <Button size="sm" variant="outline">
          <UserPlus data-icon="inline-start" />
          Add someone
        </Button>
      </AlertDialogTrigger>
      {open ? (
        <AddAttendanceDialogForm
          key={session}
          onClose={() => setOpen(false)}
          walkCompleted={walkCompleted}
          walkId={walkId}
        />
      ) : null}
    </AlertDialog>
  );
}
