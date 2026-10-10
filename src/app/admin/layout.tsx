import type { Metadata } from "next";
import { PAGE_X_BLEED } from "@/lib/page-x";

// Only organisers reach these pages: proxy.ts answers "page not found" for
// anyone else (from the role in their sign-in token, see clerk-role.ts),
// and every page still checks the database itself before showing anything
// of its own. So this frame no longer waits for that check, and each
// page's ready-made parts (title, description, placeholder) show at once.
export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className={`-mt-6 -mb-6 flex flex-col print:m-0 ${PAGE_X_BLEED}`}>{children}</div>;
}
