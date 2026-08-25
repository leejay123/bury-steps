import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Show, UserButton } from "@clerk/nextjs";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { AFTER_AUTH_PATH, accountPortalHref } from "@/lib/urls";

export async function SiteNav() {
  const { userId } = await auth();
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "";
  const proto = headerList.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const afterAuth = `${proto}://${host}${AFTER_AUTH_PATH}`;
  let isAdmin = false;
  if (userId) {
    try {
      const row = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { role: true },
      });
      isAdmin = row?.role === "ADMIN";
    } catch {
      isAdmin = false;
    }
  }

  return (
    <nav className="flex items-center gap-3 text-sm">
      <Show when="signed-out">
        <Button variant="outline" size="sm" asChild>
          <a href={accountPortalHref("sign-in", afterAuth)}>Sign in</a>
        </Button>
        <Button size="sm" asChild>
          <a href={accountPortalHref("sign-up", afterAuth)}>Join the group</a>
        </Button>
      </Show>
      <Show when="signed-in">
        <Link href="/" className="text-muted-foreground hover:text-foreground">
          Home
        </Link>
        <Link
          href={isAdmin ? "/admin" : "/dashboard"}
          className="text-muted-foreground hover:text-foreground"
        >
          Walks
        </Link>
        {isAdmin ? (
          <>
            <Link href="/admin/members" className="text-muted-foreground hover:text-foreground">
              Members
            </Link>
            <Link href="/admin/settings" className="text-muted-foreground hover:text-foreground">
              Settings
            </Link>
          </>
        ) : null}
        <UserButton />
      </Show>
    </nav>
  );
}
