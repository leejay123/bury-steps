import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { PAGE_X_BLEED } from "@/lib/page-x";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  if (user.role !== "ADMIN") {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Walks</h1>
        <p className="text-sm text-muted-foreground">
          Members and settings are only available to organisers. Your walks are on the Walks page.
        </p>
        <Button asChild>
          <Link href="/dashboard">Go to your walks</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className={`-mt-8 -mb-8 flex flex-col print:m-0 ${PAGE_X_BLEED}`}>{children}</div>
  );
}
