"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { createWalk } from "@/server/actions";
import { FormError } from "@/components/form-error";
import { DrawerFormFooter } from "@/components/drawer-form";
import { useNotifyActionState } from "@/hooks/use-action-toast";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { WalkFormFields } from "./walk-form-fields";

/**
 * Was a form permanently on the page (see git history) — moved into a
 * Drawer behind a "Create a walk" button instead, so the Walks page opens
 * straight on the list rather than a form every visit. Same fields as
 * Edit walk (WalkFormFields).
 */
export function CreateWalkDrawer() {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, isPending] = useNotifyActionState(createWalk, () => {
    formRef.current?.reset();
    setFormKey((key) => key + 1);
    setOpen(false);
  });

  return (
    <Drawer closeDisabled={isPending} onOpenChange={setOpen} open={open} variant="form">
      <DrawerTrigger asChild>
        <Button className="w-full sm:w-auto" type="button">
          <Plus data-icon="inline-start" />
          Create a walk
        </Button>
      </DrawerTrigger>
      <DrawerContent className="min-h-0">
        <form action={action} className="flex min-h-0 flex-1 flex-col" ref={formRef}>
          <DrawerHeader className="shrink-0">
            <DrawerTitle>Create a walk</DrawerTitle>
            <DrawerDescription>
              You&apos;ll get a share link members use to join and clock in.
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-y-contain px-4 pb-4">
            <WalkFormFields idPrefix="create-walk" key={formKey} />
            <FormError message={state && !state.ok ? state.error : null} />
          </div>
          <DrawerFormFooter label="Create walk" pendingLabel="Creating…" />
        </form>
      </DrawerContent>
    </Drawer>
  );
}
