"use client";

import type React from "react";
import type { OrganiserPermissions } from "@/lib/organiser-permissions";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { DeleteMemberButton } from "../delete-member-button";
import { EditPermissionsButton } from "../edit-permissions-button";
import { ImpersonateButton } from "../impersonate-button";
import { MemberRoleButton } from "../member-role-button";
import { MemberRowActionsMenu } from "../member-row-actions-menu";
import { TransferOwnershipButton } from "../transfer-ownership-button";
import { CancelInviteButton, ResendInviteButton } from "../pending-invite-actions";

/**
 * All the header action buttons on a member's own page (role change/invite,
 * permissions, ownership transfer, remove) — a client component, not built
 * inline in the server-rendered page.
 *
 * Building the "⋯" menu means sharing one plain mutable ref object between
 * two separately-rendered pieces: the hidden widget it points at, and the
 * menu item whose onSelect clicks it (see MemberRowActionsMenu). That only
 * works when both are created by the same client-side closure. A Server
 * Component can't do this — only serializable data crosses the server/
 * client boundary, not a shared object reference or a plain function prop
 * (an inline onSelect passed straight from a Server Component to a Client
 * Component throws) — which is exactly what broke this page before.
 */
export function MemberDetailActions({
  attendanceCount,
  id,
  inviteRequired,
  isYou,
  name,
  pendingInvite,
  permissions,
  role,
  viewerIsOwner,
  walkCount,
}: {
  attendanceCount: number;
  id: string;
  inviteRequired: boolean;
  isYou: boolean;
  name: string;
  pendingInvite: { sentAt: string; expiresAt: string; expired: boolean } | null;
  permissions: OrganiserPermissions;
  role: "ADMIN" | "MEMBER";
  viewerIsOwner: boolean;
  walkCount: number;
}) {
  // Every applicable action collapses behind a single "⋯" menu — even when
  // there's only one — so the header's controls are always just Impersonate
  // (when it applies) plus that one button, never a mix of bare buttons and
  // a menu depending on the count. Impersonate stays a direct button on its
  // own regardless — it's unrelated to role changes and only ever appears
  // for a plain member.
  //
  // For an action that opens a dialog/drawer, `menuItem` never renders that
  // widget itself — it only proxies a click to the real (always-mounted,
  // visually hidden) trigger rendered by `hiddenWidget`, which lives
  // outside MemberRowActionsMenu entirely. See that component's own doc
  // comment for why. Resend/Cancel invite have no dialog to protect, so
  // their `menuItem` is just their own real DropdownMenuItem form.
  const actions: { key: string; menuItem: React.ReactNode; hiddenWidget?: React.ReactNode }[] = [];

  if (pendingInvite) {
    actions.push({
      key: "resend",
      menuItem: <ResendInviteButton asMenuItem key="resend" userId={id} />,
    });
    actions.push({
      key: "cancel",
      menuItem: <CancelInviteButton asMenuItem key="cancel" userId={id} />,
    });
    if (viewerIsOwner) {
      const editPermissionsRef: { current: HTMLButtonElement | null } = { current: null };
      actions.push({
        key: "edit-permissions",
        menuItem: (
          <DropdownMenuItem key="edit-permissions" onSelect={() => editPermissionsRef.current?.click()}>
            Edit permissions
          </DropdownMenuItem>
        ),
        hiddenWidget: (
          <EditPermissionsButton
            hideTrigger
            initialPermissions={permissions}
            key="edit-permissions-hidden"
            name={name}
            triggerRef={editPermissionsRef}
            userId={id}
          />
        ),
      });
    }
  } else if (
    // Changing your own role here would be easy to hit by mistake and
    // immediately cost you organiser access to fix it — same reasoning as
    // hiding your own Remove action below. Another organiser can change it
    // for you instead. Promoting, demoting, editing permissions, and
    // transferring ownership are all owner-only regardless of whose page
    // this is.
    !isYou &&
    viewerIsOwner
  ) {
    const roleRef: { current: HTMLButtonElement | null } = { current: null };
    const promoting = role === "MEMBER";
    actions.push({
      key: "role",
      menuItem: (
        <DropdownMenuItem key="role" onSelect={() => roleRef.current?.click()}>
          {promoting ? (inviteRequired ? "Invite as organiser" : "Make organiser") : "Make member"}
        </DropdownMenuItem>
      ),
      hiddenWidget: (
        <MemberRoleButton
          hideTrigger
          initialPermissions={permissions}
          inviteRequired={inviteRequired}
          key="role-hidden"
          name={name}
          role={role}
          triggerRef={roleRef}
          userId={id}
        />
      ),
    });
    if (role === "ADMIN") {
      const editPermissionsRef: { current: HTMLButtonElement | null } = { current: null };
      const transferRef: { current: HTMLButtonElement | null } = { current: null };
      actions.push(
        {
          key: "edit-permissions",
          menuItem: (
            <DropdownMenuItem key="edit-permissions" onSelect={() => editPermissionsRef.current?.click()}>
              Edit permissions
            </DropdownMenuItem>
          ),
          hiddenWidget: (
            <EditPermissionsButton
              hideTrigger
              initialPermissions={permissions}
              key="edit-permissions-hidden"
              name={name}
              triggerRef={editPermissionsRef}
              userId={id}
            />
          ),
        },
        {
          key: "transfer",
          menuItem: (
            <DropdownMenuItem key="transfer" onSelect={() => transferRef.current?.click()}>
              Make owner
            </DropdownMenuItem>
          ),
          hiddenWidget: (
            <TransferOwnershipButton
              hideTrigger
              key="transfer-hidden"
              name={name}
              triggerRef={transferRef}
              userId={id}
            />
          ),
        },
      );
    }
  }

  if (!isYou && (role !== "ADMIN" || viewerIsOwner)) {
    const deleteRef: { current: HTMLButtonElement | null } = { current: null };
    actions.push({
      key: "delete",
      menuItem: (
        <DropdownMenuItem key="delete" onSelect={() => deleteRef.current?.click()} variant="destructive">
          Remove
        </DropdownMenuItem>
      ),
      hiddenWidget: (
        <DeleteMemberButton
          attendanceCount={attendanceCount}
          hideTrigger
          key="delete-hidden"
          name={name}
          redirectTo="/admin/members"
          triggerRef={deleteRef}
          userId={id}
          walkCount={walkCount}
        />
      ),
    });
  }

  return (
    <div className="flex flex-wrap gap-2 sm:shrink-0 sm:justify-end">
      {role === "MEMBER" && !pendingInvite ? <ImpersonateButton name={name} userId={id} /> : null}
      {actions.length > 0 ? (
        <MemberRowActionsMenu>{actions.map((a) => a.menuItem)}</MemberRowActionsMenu>
      ) : null}
      {/* Always-mounted, visually hidden widgets the menu above proxies
          clicks to — see MemberRowActionsMenu. */}
      {actions.map((a) => a.hiddenWidget)}
    </div>
  );
}
