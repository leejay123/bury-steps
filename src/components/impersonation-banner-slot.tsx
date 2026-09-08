import { getImpersonationInfo } from "@/lib/auth";
import { ImpersonationBanner } from "./impersonation-banner";

/**
 * A separate server component (rather than calling getImpersonationInfo
 * directly in the root layout) so it can be wrapped in its own <Suspense>
 * boundary — same reasoning as SiteNav's own Suspense wrapper: this reads
 * Clerk's auth state, and awaiting a dynamic API straight in the layout
 * body would make every page dynamic instead of just this slice.
 */
export async function ImpersonationBannerSlot() {
  const impersonation = await getImpersonationInfo();
  if (!impersonation) return null;
  return <ImpersonationBanner adminName={impersonation.adminName} targetName={impersonation.targetName} />;
}
