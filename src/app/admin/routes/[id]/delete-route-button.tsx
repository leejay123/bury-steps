"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Trash2 } from "lucide-react";
import { deleteRoute } from "@/server/actions";
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
      {pending ? "Deleting…" : "Delete route"}
    </Button>
  );
}

function DeleteRouteDialogForm({
  id,
  name,
  onClose,
  walkCount,
}: {
  id: string;
  name: string;
  onClose: () => void;
  walkCount: number;
}) {
  const [state, action, isPending] = useNotifyActionState(deleteRoute, onClose);

  return (
    <AlertDialogContent closeDisabled={isPending}>
      <form action={action} className="space-y-4">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {name}?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>The route will be deleted and you would have to import the file again.</p>
              {walkCount > 0 ? (
                <p>
                  {walkCount === 1 ? "One walk uses" : `${walkCount} walks use`} this route. Those
                  walks stay exactly as they are — they simply stop showing a map. No clock-ins or
                  walk details are affected.
                </p>
              ) : null}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <input name="id" type="hidden" value={id} />
        <FormError message={state && !state.ok ? state.error : null} />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending} type="button">
            Keep the route
          </AlertDialogCancel>
          <Confirm />
        </AlertDialogFooter>
      </form>
    </AlertDialogContent>
  );
}

export function DeleteRouteButton({
  id,
  name,
  walkCount,
}: {
  id: string;
  name: string;
  walkCount: number;
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
        <Button size="sm" variant="destructive">
          <Trash2 data-icon="inline-start" />
          Delete route
        </Button>
      </AlertDialogTrigger>
      {open ? (
        <DeleteRouteDialogForm
          id={id}
          key={session}
          name={name}
          onClose={() => setOpen(false)}
          walkCount={walkCount}
        />
      ) : null}
    </AlertDialog>
  );
}
