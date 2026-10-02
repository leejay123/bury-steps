import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { PAGE_X_BLEED } from "@/lib/page-x";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className={`-mt-6 -mb-6 flex flex-col print:m-0 ${PAGE_X_BLEED}`}>{children}</div>
  );
}
