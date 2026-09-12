"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { setOrganiserPermissions, type ActionResult } from "@/server/actions";
import { preventDismissWhilePending, useActionToast } from "@/hooks/use-action-toast";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { OrganiserPermissionFields } from "./organiser-permissions-fields";
import { hasAnyPermission, type OrganiserPermissions } from "@/lib/organiser-permissions";

function SaveSubmit({ hasSelection }: { hasSelection: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending || !hasSelection} type="submit">
      {pending ? "Saving…" : "Save permissions"}
    </Button>
  );
}

/** Edits an existing organiser's permissions — or a pending invite's, before
 * it's even accepted — without touching their role. See MemberRoleButton
 * for picking permissions at invite time instead. */
export function EditPermissionsButton({
  asMenuItem = false,
  initialPermissions,
  name,
  onChanged,
  userId,
}: {
  /** Render the trigger as a DropdownMenuItem (for use inside
   * MemberRowActionsMenu) instead of a standalone Button. */
  asMenuItem?: boolean;
  initialPermissions: OrganiserPermissions;
  name: string;
  onChanged?: () => void;
  userId: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    setOrganiserPermissions,
    null,
  );
  const [permissions, setPermissions] = useState<OrganiserPermissions>(initialPermissions);
  useActionToast(state, () => {
    setOpen(false);
    onChanged?.();
  });
  useResetOnChange([open], () => {
    if (open) setPermissions(initialPermissions);
  });

  return (
    <>
      {asMenuItem ? (
        <DropdownMenuItem onSelect={() => setOpen(true)}>Edit permissions</DropdownMenuItem>
      ) : (
        <Button onClick={() => setOpen(true)} size="xs" variant="outline">
          Edit permissions
        </Button>
      )}
      <Drawer
        closeDisabled={isPending}
        onOpenChange={preventDismissWhilePending(isPending, setOpen)}
        open={open}
        variant="form"
      >
        <DrawerContent className="sm:max-w-md">
          <form action={action} className="flex min-h-0 flex-1 flex-col">
            <DrawerHeader>
              <DrawerTitle>{name}&rsquo;s permissions</DrawerTitle>
              <DrawerDescription>
                What they can do in organiser tools. Takes effect immediately.
              </DrawerDescription>
            </DrawerHeader>
            <div className="flex-1 overflow-y-auto overscroll-y-contain px-4">
              <OrganiserPermissionFields
                disabled={isPending}
                onChange={setPermissions}
                permissions={permissions}
              />
              <FormError message={state && !state.ok ? state.error : null} />
            </div>
            <input name="userId" type="hidden" value={userId} />
            <DrawerFooter>
              <SaveSubmit hasSelection={hasAnyPermission(permissions)} />
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>
    </>
  );
}
