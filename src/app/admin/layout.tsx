import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { AdminSectionTabs } from "./admin-section-tabs";
import { Button } from "@/components/ui/button";
import { FullWidthDivider } from "@/components/full-width-divider";

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
    <div className="-mx-4 -mt-8 -mb-8 flex flex-col md:-mx-8">
      <div className="relative px-4 py-6 md:px-8">
        <h1 className="text-2xl font-semibold tracking-tight">Organiser tools</h1>
        <FullWidthDivider position="bottom" />
      </div>
      <AdminSectionTabs />
      {children}
    </div>
  );
}
