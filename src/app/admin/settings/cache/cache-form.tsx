"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { clearSiteCache, type ActionResult } from "@/server/actions";
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
  const [state, action] = useActionState<ActionResult | null, FormData>(clearSiteCache, null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message ?? "Site cache cleared.");
      setOpen(false);
    } else {
      toast.error(state.error);
    }
  }, [state]);

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
      <AlertDialog onOpenChange={setOpen} open={open}>
        <AlertDialogTrigger asChild>
          <Button className="w-full sm:w-auto" type="button">
            Clear cache
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <form action={action}>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear the site cache?</AlertDialogTitle>
              <AlertDialogDescription>
                The public homepage will reload fresh content on the next visit. Nothing is deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel type="button">Keep it</AlertDialogCancel>
              <ConfirmClear />
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
