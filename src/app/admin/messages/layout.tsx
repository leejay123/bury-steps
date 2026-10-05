import { requirePermission } from "@/lib/auth";

// Like the admin layout: waits for the organiser check, so nothing to show instantly.
export const instant = false;

/**
 * Checked here, outside the page's loading placeholder (loading.tsx wraps the
 * page, not this layout), so an organiser without Messages access gets a
 * clean "page not found" instead of a page that had already started to
 * arrive (React error #419 in the console).
 */
export default async function MessagesLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("permMessages");
  return children;
}
