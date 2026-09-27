import { Show } from "@clerk/nextjs";
import { getOptionalUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { AFTER_AUTH_PATH, accountPortalHref, appUrl } from "@/lib/urls";
import { SiteNavLinks, SiteMobileMenu } from "@/components/site-nav-menu";
import { SiteUserButton } from "@/components/site-user-button";
import { navItems } from "@/components/site-nav-items";
import { NotificationBell } from "@/components/notification-bell";
import { getSiteNoticeState } from "@/lib/site-notices";
import { getProgressEnabled } from "@/lib/progress-settings";
import { FULL_ORGANISER_PERMISSIONS, ORGANISER_PERMISSIONS } from "@/lib/organiser-permissions";
import { isOwner } from "@/lib/site-owner";

export function SiteNavFallback() {
  return (
    <>
      <div className="hidden min-w-0 items-center justify-center md:flex" />
      <div className="flex min-w-0 items-center justify-end gap-2 justify-self-end sm:gap-3">
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

  const walksHref = isAdmin ? "/admin" : "/walks";
  const [{ notices, unreadIds }, progressEnabled, permissions] = await Promise.all([
    user ? getSiteNoticeState(user.id, user.firstName) : Promise.resolve({ notices: [], unreadIds: [] as string[] }),
    getProgressEnabled(),
    isAdmin && user
      ? isOwner(user.id).then((owner) => (owner ? FULL_ORGANISER_PERMISSIONS : ORGANISER_PERMISSIONS))
      : Promise.resolve(undefined),
  ]);

  return (
    <>
      <div className="hidden min-w-0 items-center justify-center md:flex">
        <Show when="signed-in">
          <SiteNavLinks
            isAdmin={isAdmin}
            permissions={permissions}
            progressEnabled={progressEnabled}
            walksHref={walksHref}
          />
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
          <NotificationBell notices={notices} unreadIds={unreadIds} />
          <SiteUserButton progressEnabled={progressEnabled} />
        </Show>
      </div>
    </>
  );
}

export async function SiteMobileNav() {
  const user = await getOptionalUser();
  if (!user) {
    const afterAuth = `${appUrl()}${AFTER_AUTH_PATH}`;
    return (
      <SiteMobileMenu
        items={[
          { href: "/", label: "Home" },
          { href: "/contact", label: "Contact" },
          { href: accountPortalHref("sign-in", afterAuth), label: "Sign in" },
          { href: accountPortalHref("sign-up", afterAuth), label: "Join the group" },
        ]}
      />
    );
  }

  const isAdmin = user.role === "ADMIN";
  const [progressEnabled, permissions] = await Promise.all([
    getProgressEnabled(),
    isAdmin
      ? isOwner(user.id).then((owner) => (owner ? FULL_ORGANISER_PERMISSIONS : ORGANISER_PERMISSIONS))
      : Promise.resolve(undefined),
  ]);

  return (
    <SiteMobileMenu
      items={navItems(isAdmin, isAdmin ? "/admin" : "/walks", permissions, progressEnabled)}
    />
  );
}
