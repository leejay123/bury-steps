"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { setOrganiserPermissions, type ActionResult } from "@/server/actions";
import { preventDismissWhilePending, useActionToast } from "@/hooks/use-action-toast";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { OrganiserPermissionFields } from "./organiser-permissions-fields";
import { FULL_ORGANISER_PERMISSIONS, type OrganiserPermissions } from "@/lib/organiser-permissions";

function SaveSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} type="submit">
      {pending ? "Saving…" : "Save permissions"}
    </Button>
  );
}

/** Edits an existing organiser's permissions — or a pending invite's, before
 * it's even accepted — without touching their role. See MemberRoleButton
 * for picking permissions at invite time instead. */
export function EditPermissionsButton({
  initialPermissions,
  name,
  onChanged,
  userId,
  viewerPermissions = FULL_ORGANISER_PERMISSIONS,
}: {
  initialPermissions: OrganiserPermissions;
  name: string;
  onChanged?: () => void;
  userId: string;
  /** The signed-in organiser's own permissions — caps what they can change
   * here to what they hold themselves (see clampGrantablePermissions).
   * Omitted defaults to full access. */
  viewerPermissions?: OrganiserPermissions;
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
      <Button onClick={() => setOpen(true)} size="xs" variant="outline">
        Edit permissions
      </Button>
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
                viewerPermissions={viewerPermissions}
              />
              <FormError message={state && !state.ok ? state.error : null} />
            </div>
            <input name="userId" type="hidden" value={userId} />
            <DrawerFooter>
              <SaveSubmit />
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>
    </>
  );
}
