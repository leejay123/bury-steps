import { headers } from "next/headers";
import Link from "next/link";
import { Show, UserButton } from "@clerk/nextjs";
import { getOptionalUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { AFTER_AUTH_PATH, accountPortalHref } from "@/lib/urls";

export async function SiteNav() {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "";
  const proto = headerList.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const afterAuth = `${proto}://${host}${AFTER_AUTH_PATH}`;
  const user = await getOptionalUser();
  const isAdmin = user?.role === "ADMIN";

  return (
    <nav className="flex min-w-0 flex-1 items-center gap-3 text-sm">
      <Show when="signed-in">
        <div className="flex min-w-0 items-center gap-3 overflow-x-auto">
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
        </div>
      </Show>
      <div className="ml-auto flex shrink-0 items-center gap-3">
        <Show when="signed-out">
          <Button variant="outline" size="sm" asChild>
            <a href={accountPortalHref("sign-in", afterAuth)}>Sign in</a>
          </Button>
          <Button size="sm" asChild>
            <a href={accountPortalHref("sign-up", afterAuth)}>Join the group</a>
          </Button>
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </div>
    </nav>
  );
}
