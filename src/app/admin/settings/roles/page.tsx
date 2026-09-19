import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { isOwner } from "@/lib/site-owner";
import { getOrganiserRolePermissions } from "@/lib/role-permissions";
import { SettingsPage } from "../settings-page";
import { RolePermissionsForm } from "./role-permissions-form";

export const dynamic = "force-dynamic";

/**
 * The one shared set of capabilities every organiser has — see
 * src/lib/organiser-permissions.ts. Owner-only, same "looks like a missing
 * link" 404 as requirePermission gives an organiser without a permission,
 * rather than a distinguishable "access denied".
 */
export default async function RolesSettingsPage() {
  const admin = await requireAdmin();
  if (!(await isOwner(admin.id))) notFound();

  const permissions = await getOrganiserRolePermissions();

  return (
    <SettingsPage
      description="What every organiser can do — one shared set, applied to all of them at once. A few sensitive, permanent actions (deleting a walk or report, removing a member's account, logging in as a member) always stay yours alone, whatever's ticked below."
      title="Roles"
    >
      <RolePermissionsForm permissions={permissions} />
    </SettingsPage>
  );
}
