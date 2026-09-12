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
  // One "primary" action shown as a direct button — the one someone's most
  // likely to want next — plus whatever else applies collapsed behind a
  // single "⋯" menu, so the owner viewing an organiser's page doesn't get a
  // wall of buttons (Make member/Edit permissions/Make owner/Remove). A lone
  // secondary action is still shown as a plain button rather than hidden
  // behind a one-item menu. Impersonate stays a direct button on its own —
  // it's unrelated to role changes and only ever appears for a plain member.
  //
  // For an action that opens a dialog/drawer, `menuItem` never renders that
  // widget itself — it only proxies a click to the real (always-mounted,
  // visually hidden) trigger rendered by `hiddenWidget`, which lives
  // outside MemberRowActionsMenu entirely. See that component's own doc
  // comment for why. Resend/Cancel invite have no dialog to protect, so
  // their `menuItem` is just their own real DropdownMenuItem form.
  let primaryAction: React.ReactNode = null;
  const secondaryActions: {
    key: string;
    menuItem: React.ReactNode;
    standalone: React.ReactNode;
    hiddenWidget?: React.ReactNode;
  }[] = [];

  if (pendingInvite) {
    primaryAction = <ResendInviteButton key="resend" userId={id} />;
    secondaryActions.push({
      key: "cancel",
      menuItem: <CancelInviteButton asMenuItem key="cancel" userId={id} />,
      standalone: <CancelInviteButton key="cancel" userId={id} />,
    });
    if (viewerIsOwner) {
      const editPermissionsRef: { current: HTMLButtonElement | null } = { current: null };
      secondaryActions.push({
        key: "edit-permissions",
        menuItem: (
          <DropdownMenuItem key="edit-permissions" onSelect={() => editPermissionsRef.current?.click()}>
            Edit permissions
          </DropdownMenuItem>
        ),
        standalone: (
          <EditPermissionsButton initialPermissions={permissions} key="edit-permissions" name={name} userId={id} />
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
    // hiding your own Remove button below. Another organiser can change it
    // for you instead. Promoting, demoting, editing permissions, and
    // transferring ownership are all owner-only regardless of whose page
    // this is.
    !isYou &&
    viewerIsOwner
  ) {
    primaryAction = (
      <MemberRoleButton
        initialPermissions={permissions}
        inviteRequired={inviteRequired}
        key="role"
        name={name}
        role={role}
        userId={id}
      />
    );
    if (role === "ADMIN") {
      const editPermissionsRef: { current: HTMLButtonElement | null } = { current: null };
      const transferRef: { current: HTMLButtonElement | null } = { current: null };
      secondaryActions.push(
        {
          key: "edit-permissions",
          menuItem: (
            <DropdownMenuItem key="edit-permissions" onSelect={() => editPermissionsRef.current?.click()}>
              Edit permissions
            </DropdownMenuItem>
          ),
          standalone: (
            <EditPermissionsButton
              initialPermissions={permissions}
              key="edit-permissions"
              name={name}
              userId={id}
            />
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
          standalone: <TransferOwnershipButton key="transfer" name={name} userId={id} />,
          hiddenWidget: (
            <TransferOwnershipButton hideTrigger key="transfer-hidden" name={name} triggerRef={transferRef} userId={id} />
          ),
        },
      );
    }
  }

  if (!isYou && (role !== "ADMIN" || viewerIsOwner)) {
    const deleteRef: { current: HTMLButtonElement | null } = { current: null };
    secondaryActions.push({
      key: "delete",
      menuItem: (
        <DropdownMenuItem key="delete" onSelect={() => deleteRef.current?.click()} variant="destructive">
          Remove
        </DropdownMenuItem>
      ),
      standalone: (
        <DeleteMemberButton
          attendanceCount={attendanceCount}
          key="delete"
          name={name}
          redirectTo="/admin/members"
          userId={id}
          walkCount={walkCount}
        />
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
      {primaryAction}
      {secondaryActions.length === 0
        ? null
        : secondaryActions.length === 1
          ? secondaryActions[0].standalone
          : <MemberRowActionsMenu>{secondaryActions.map((s) => s.menuItem)}</MemberRowActionsMenu>}
      {/* Always-mounted, visually hidden widgets for whichever secondary
          actions the menu above is proxying clicks to — never rendered
          while that action shows as the lone standalone button instead. */}
      {secondaryActions.length > 1 ? secondaryActions.map((s) => s.hiddenWidget) : null}
    </div>
  );
}
