"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { clearSiteCache, type ActionResult } from "@/server/actions";
import { preventDismissWhilePending, useActionToast } from "@/hooks/use-action-toast";
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
import { SettingsSection } from "../settings-page";

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
    <SettingsSection
      description="The homepage is stored briefly so it loads quickly. Clear it if photos, quotes, or FAQs still look old after you saved. Walks and members are not deleted."
      title="Public homepage cache"
    >
      <AlertDialog
        closeDisabled={isPending}
        onOpenChange={preventDismissWhilePending(isPending, setOpen)}
        open={open}
      >
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
    </SettingsSection>
  );
}
