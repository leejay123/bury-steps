"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { clearSiteCache, type ActionResult } from "@/server/actions";
import { useActionToast } from "@/hooks/use-action-toast";
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

function ConfirmClear() {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} type="submit">
      {pending ? "Clearing…" : "Clear cache"}
    </Button>
  );
}

export function ClearCacheForm() {
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    clearSiteCache,
    null,
  );
  const [open, setOpen] = useState(false);
  useActionToast(state, () => setOpen(false));

  return (
    <div className="flex flex-col gap-4 rounded-xl border p-4">
      <div className="flex flex-col gap-1">
        <p className="font-medium">Public homepage cache</p>
        <p className="text-sm text-muted-foreground">
          The homepage is stored for a short time so visitors see it quickly. If photos, quotes, or
          FAQs still look old after you saved them, clear the cache. This does not delete walks,
          members, or photos.
        </p>
      </div>
      <AlertDialog onOpenChange={(next) => setOpen(isPending ? true : next)} open={open}>
        <AlertDialogTrigger asChild>
          <Button className="w-full sm:w-auto" type="button">
            Clear cache
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent closeDisabled={isPending}>
          <form action={action}>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear the site cache?</AlertDialogTitle>
              <AlertDialogDescription>
                The public homepage will reload fresh content on the next visit. Nothing is deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <FormError message={state && !state.ok ? state.error : null} />
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending} type="button">
                Keep it
              </AlertDialogCancel>
              <ConfirmClear />
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
