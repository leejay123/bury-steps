import { Show, UserButton } from "@clerk/nextjs";
import { getOptionalUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { AFTER_AUTH_PATH, accountPortalHref, appUrl } from "@/lib/urls";
import { SiteNavLinks, SiteMobileNavBar } from "@/components/site-nav-menu";
import { NotificationBell } from "@/components/notification-bell";
import { getSiteNoticeState, getVisitorNoticeState } from "@/lib/site-notices";

export function SiteNavFallback() {
  return (
    <>
      <div className="hidden min-w-0 items-center justify-center md:flex" />
      <div className="flex min-w-0 items-center justify-end gap-2 justify-self-end sm:gap-3">
        <div className="size-8 rounded-md bg-muted" />
        <div className="h-8 w-[4.5rem] rounded-md bg-muted" />
        <div className="h-8 w-[7.5rem] rounded-md bg-muted" />
      </div>
    </>
  );
}

export async function SiteNav() {
  const afterAuth = `${appUrl()}${AFTER_AUTH_PATH}`;
  const user = await getOptionalUser();
  const isAdmin = user?.role === "ADMIN";

  const walksHref = isAdmin ? "/admin" : "/dashboard";
  const memberNotices = user ? await getSiteNoticeState(user.id) : null;
  const visitorNotices = user ? null : await getVisitorNoticeState();

  return (
    <>
      <div className="hidden min-w-0 items-center justify-center md:flex">
        <Show when="signed-in">
          <SiteNavLinks isAdmin={isAdmin} walksHref={walksHref} />
        </Show>
      </div>
      <div className="flex min-w-0 items-center justify-end gap-2 justify-self-end sm:gap-3">
        <Show when="signed-out">
          <NotificationBell notices={visitorNotices?.notices ?? []} viewer="visitor" />
          <Button variant="outline" size="sm" asChild>
            <a href={accountPortalHref("sign-in", afterAuth)}>Sign in</a>
          </Button>
          <Button size="sm" asChild>
            <a href={accountPortalHref("sign-up", afterAuth)}>Join the group</a>
          </Button>
        </Show>
        <Show when="signed-in">
          <NotificationBell
            notices={memberNotices?.notices ?? []}
            unreadIds={memberNotices?.unreadIds ?? []}
            viewer="member"
          />
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
