import { requirePermission } from "@/lib/auth";

// Like the admin layout: waits for the organiser check, so nothing to show instantly.
export const instant = false;

/**
 * Checked here, before either page (the list or one member) starts to
 * stream, so an organiser without Members access gets a clean "page not
 * found" instead of a page that had already started to arrive (React error
 * #419 in the console).
 */
export default async function MembersLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("permMembersView");
  return children;
}
