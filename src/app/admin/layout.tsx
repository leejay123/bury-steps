import type { Metadata } from "next";
import { getOptionalUser, requireAdmin } from "@/lib/auth";
import { PAGE_X_BLEED } from "@/lib/page-x";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

// Everyone else gets the same tab title as any missing page (the site's
// name) — "Admin" told members and visitors that something lives here.
export async function generateMetadata(): Promise<Metadata> {
  const user = await getOptionalUser();
  const robots = { index: false, follow: false };
  return user?.role === "ADMIN" ? { title: "Admin", robots } : { robots };
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className={`-mt-6 -mb-6 flex flex-col print:m-0 ${PAGE_X_BLEED}`}>{children}</div>
  );
}
