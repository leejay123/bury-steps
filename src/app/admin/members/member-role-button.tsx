"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { setMemberRole, type ActionResult } from "@/server/actions";
import { preventDismissWhilePending, useActionToast } from "@/hooks/use-action-toast";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { OrganiserPermissionFields } from "./organiser-permissions-fields";
import {
  clampGrantablePermissions,
  FULL_ORGANISER_PERMISSIONS,
  hasAnyPermission,
  hasFullAccess,
  NO_ORGANISER_PERMISSIONS,
  type OrganiserPermissions,
} from "@/lib/organiser-permissions";

/** Must type this word to confirm a *demotion* — same idea as site reset.
 * Promoting goes through the permissions drawer instead: picking what
 * they can do and clicking the (clearly labelled) submit button is
 * already a deliberate step, so it doesn't also ask for typed confirmation. */
export const ROLE_CONFIRM_WORD = "Confirm";

function DemoteDialog({
  name,
  onChanged,
  open,
  setOpen,
  userId,
}: {
  name: string;
  onChanged?: () => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  userId: string;
}) {
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    setMemberRole,
    null,
  );
  const [confirmValue, setConfirmValue] = useState("");
  useActionToast(state, () => {
    setOpen(false);
    onChanged?.();
  });
  useResetOnChange([open], () => {
    if (!open) setConfirmValue("");
  });
  const ready = confirmValue.trim().toLowerCase() === ROLE_CONFIRM_WORD.toLowerCase();

  return (
    <AlertDialog
      closeDisabled={isPending}
      onOpenChange={preventDismissWhilePending(isPending, setOpen)}
      open={open}
    >
      <AlertDialogContent closeDisabled={isPending}>
        {/*
          Use a normal submit Button — not AlertDialogAction. Radix Action
          closes the dialog on click, which unmounts the form before the
          server action can settle, so the role never appeared to change.
        */}
        <form action={action} className="flex flex-col gap-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Make {name} a member?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  They will lose organiser tools and keep their member account, walk history, and
                  clock-ins.
                </p>
                <p>There must still be at least one organiser left in the group.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input name="userId" type="hidden" value={userId} />
          <input name="role" type="hidden" value="MEMBER" />
          <input name="confirm" type="hidden" value={confirmValue} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`role-confirm-${userId}`}>
              Type &ldquo;{ROLE_CONFIRM_WORD}&rdquo; to continue
            </Label>
            <Input
              autoComplete="off"
              disabled={isPending}
              id={`role-confirm-${userId}`}
              onChange={(event) => setConfirmValue(event.target.value)}
              placeholder={ROLE_CONFIRM_WORD}
              spellCheck={false}
              value={confirmValue}
            />
          </div>
          <FormError message={state && !state.ok ? state.error : null} />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending} type="button">
              Cancel
            </AlertDialogCancel>
            <Button disabled={isPending || !ready} type="submit">
              {isPending ? "Demoting…" : "Make member"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function PromoteSubmit({ hasSelection, inviteRequired }: { hasSelection: boolean; inviteRequired: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending || !hasSelection} type="submit">
      {pending ? (inviteRequired ? "Inviting…" : "Promoting…") : inviteRequired ? "Invite as organiser" : "Make organiser"}
    </Button>
  );
}

function PromoteDrawer({
  initialPermissions,
  inviteRequired,
  name,
  onChanged,
  open,
  setOpen,
  userId,
  viewerPermissions,
}: {
  initialPermissions: OrganiserPermissions;
  inviteRequired: boolean;
  name: string;
  onChanged?: () => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  userId: string;
  viewerPermissions: OrganiserPermissions;
}) {
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    setMemberRole,
    null,
  );
  // Pre-checking a box the viewer can't actually grant would promise
  // something the server-side cap (clampGrantablePermissions) then
  // silently drops — so a limited organiser's starting selection is capped
  // to what they hold themselves, same as what actually gets saved.
  const seedPermissions = hasFullAccess(viewerPermissions)
    ? initialPermissions
    : clampGrantablePermissions(viewerPermissions, initialPermissions, NO_ORGANISER_PERMISSIONS);
  const [permissions, setPermissions] = useState<OrganiserPermissions>(seedPermissions);
  useActionToast(state, () => {
    setOpen(false);
    onChanged?.();
  });
  // Re-seed from the current row every time the drawer opens — otherwise a
  // second invite (after cancelling the first without submitting) would
  // keep showing whatever was ticked last time instead of their actual
  // starting permissions.
  useResetOnChange([open], () => {
    if (open) setPermissions(seedPermissions);
  });

  return (
    <Drawer
      closeDisabled={isPending}
      onOpenChange={preventDismissWhilePending(isPending, setOpen)}
      open={open}
      variant="form"
    >
      <DrawerContent className="sm:max-w-md">
        <form action={action} className="flex min-h-0 flex-1 flex-col">
          <DrawerHeader>
            <DrawerTitle>
              {inviteRequired ? `Invite ${name} to become an organiser?` : `Make ${name} an organiser?`}
            </DrawerTitle>
            <DrawerDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                {inviteRequired ? (
                  <p>
                    They&rsquo;ll get an email with a link to accept. Nothing changes for them
                    until they click it — you can cancel or resend the invite, or change these
                    permissions, any time before then.
                  </p>
                ) : (
                  <p>You can change these permissions, or change them back to a member, any time from Members.</p>
                )}
              </div>
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
          <input name="role" type="hidden" value="ADMIN" />
          {/* The drawer itself — picking permissions, then clicking this
              clearly-labelled submit — is the deliberate step here, so no
              separate typed confirmation like the demote dialog asks for. */}
          <input name="confirm" type="hidden" value="confirm" />
          <DrawerFooter>
            <PromoteSubmit hasSelection={hasAnyPermission(permissions)} inviteRequired={inviteRequired} />
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}

export function MemberRoleButton({
  initialPermissions = FULL_ORGANISER_PERMISSIONS,
  inviteRequired = false,
  name,
  onChanged,
  role,
  userId,
  viewerPermissions = FULL_ORGANISER_PERMISSIONS,
}: {
  /** Permissions to preselect in the promote drawer — the row's existing
   * columns (already true-by-default for anyone never customized). */
  initialPermissions?: OrganiserPermissions;
  /** When true, promoting sends an invite the member must accept instead of
   * taking effect immediately — see Settings → Display → Organisers. */
  inviteRequired?: boolean;
  name: string;
  /** Called after a successful change — lets a parent list re-fetch its own
   * local rows, which a plain router.refresh() doesn't reach on its own. */
  onChanged?: () => void;
  role: "ADMIN" | "MEMBER";
  userId: string;
  /** The signed-in organiser's own permissions — caps what they can grant
   * here to what they hold themselves (see clampGrantablePermissions).
   * Omitted defaults to full access. */
  viewerPermissions?: OrganiserPermissions;
}) {
  const promoting = role === "MEMBER";
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} size="xs" variant="outline">
        {promoting ? (inviteRequired ? "Invite as organiser" : "Make organiser") : "Make member"}
      </Button>
      {promoting ? (
        <PromoteDrawer
          initialPermissions={initialPermissions}
          inviteRequired={inviteRequired}
          name={name}
          onChanged={onChanged}
          open={open}
          setOpen={setOpen}
          userId={userId}
          viewerPermissions={viewerPermissions}
        />
      ) : (
        <DemoteDialog name={name} onChanged={onChanged} open={open} setOpen={setOpen} userId={userId} />
      )}
    </>
  );
}
