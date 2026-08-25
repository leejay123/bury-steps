import { headers } from "next/headers";
import { Show, UserButton } from "@clerk/nextjs";
import { getOptionalUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { AFTER_AUTH_PATH, accountPortalHref } from "@/lib/urls";
import { SiteNavMenu } from "@/components/site-nav-menu";

export async function SiteNav() {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "";
  const proto = headerList.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const afterAuth = `${proto}://${host}${AFTER_AUTH_PATH}`;
  const user = await getOptionalUser();
  const isAdmin = user?.role === "ADMIN";

  return (
    <>
      <div className="flex min-w-0 items-center justify-center">
        <Show when="signed-in">
          <SiteNavMenu isAdmin={isAdmin} walksHref={isAdmin ? "/admin" : "/dashboard"} />
        </Show>
      </div>
      <div className="flex min-w-0 items-center justify-end gap-3 justify-self-end">
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
    </>
  );
}
