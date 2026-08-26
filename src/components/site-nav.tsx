import { headers } from "next/headers";
import { Show, UserButton } from "@clerk/nextjs";
import { getOptionalUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { AFTER_AUTH_PATH, accountPortalHref } from "@/lib/urls";
import { SiteNavLinks, SiteMobileNavBar } from "@/components/site-nav-menu";
import { NotificationBell } from "@/components/notification-bell";
import { getSiteNotices, getUnreadNoticeCount } from "@/lib/site-notices";

export async function SiteNav() {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "";
  const proto = headerList.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const afterAuth = `${proto}://${host}${AFTER_AUTH_PATH}`;
  const user = await getOptionalUser();
  const isAdmin = user?.role === "ADMIN";

  const walksHref = isAdmin ? "/admin" : "/dashboard";
  const [notices, unreadCount] = user
    ? await Promise.all([getSiteNotices(), getUnreadNoticeCount(user.id)])
    : [[], 0];

  return (
    <>
      <div className="hidden min-w-0 items-center justify-center md:flex">
        <Show when="signed-in">
          <SiteNavLinks isAdmin={isAdmin} walksHref={walksHref} />
        </Show>
      </div>
      <div className="flex min-w-0 items-center justify-end gap-2 justify-self-end sm:gap-3">
        <Show when="signed-out">
          <Button variant="outline" size="sm" asChild>
            <a href={accountPortalHref("sign-in", afterAuth)}>Sign in</a>
          </Button>
          <Button size="sm" asChild>
            <a href={accountPortalHref("sign-up", afterAuth)}>Join the group</a>
          </Button>
        </Show>
        <Show when="signed-in">
          <NotificationBell notices={notices} unreadCount={unreadCount} />
          <UserButton />
        </Show>
      </div>
    </>
  );
}

export async function SiteMobileNav() {
  const user = await getOptionalUser();
  if (!user) return null;

  const isAdmin = user.role === "ADMIN";

  return <SiteMobileNavBar isAdmin={isAdmin} walksHref={isAdmin ? "/admin" : "/dashboard"} />;
}
