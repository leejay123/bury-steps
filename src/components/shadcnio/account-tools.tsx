import { Suspense } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { ClerkIsland } from "@/components/clerk-island";
import { LazySiteUserButton } from "@/components/clerk-lazy";
import { AvatarPlaceholder, BellPlaceholder } from "@/components/header-placeholders";
import { HeaderPartBoundary } from "@/components/header-part-boundary";
import { SiteNavBell } from "@/components/site-nav";
import { getOptionalUser } from "@/lib/auth";
import { getProgressEnabled } from "@/lib/progress-settings";
import { AVATAR_IMAGE_COOKIE, avatarImageSrc } from "@/lib/remembered-nav";

const PILL =
  "cn-button group/button relative inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap outline-none transition-transform disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 data-disabled:pointer-events-none data-disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[state=loading]:pointer-events-none cn-button-size-sm cn-button-variant-default rounded-[calc(var(--radius)*100)] globalnav-signin";

/**
 * The right end of the shadcn.io header for whoever is looking: Sign in for a
 * visitor; the notices bell, Dashboard and their own avatar menu for a member
 * (the same bell and account menu as the site's usual header).
 */
async function AccountTools({ signInHref }: { signInHref: string }) {
  const [user, progressEnabled] = await Promise.all([getOptionalUser(), getProgressEnabled()]);
  if (!user) {
    return (
      <li className="globalnav-item globalnav-item-icon globalnav-account" data-gn-id="account">
        <a className={PILL} href={signInHref}>
          Sign in
        </a>
      </li>
    );
  }
  const initial = (user.firstName || user.email || "?").charAt(0);
  const image = avatarImageSrc((await cookies()).get(AVATAR_IMAGE_COOKIE)?.value);
  return (
    <>
      <li className="globalnav-item globalnav-item-icon globalnav-bell" data-gn-id="bell">
        <HeaderPartBoundary name="bell">
          <Suspense fallback={<BellPlaceholder />}>
            <SiteNavBell firstName={user.firstName} userId={user.id} />
          </Suspense>
        </HeaderPartBoundary>
      </li>
      <li className="globalnav-item globalnav-item-icon globalnav-account globalnav-dashboard" data-gn-id="dashboard">
        <Link className={PILL} href="/overview">
          Dashboard
        </Link>
      </li>
      <li className="globalnav-item globalnav-item-icon globalnav-avatar-item" data-gn-id="avatar">
        <HeaderPartBoundary fallback={<AvatarPlaceholder image={image} initial={initial} />} name="account-menu">
          <ClerkIsland>
            <LazySiteUserButton image={image} initial={initial} progressEnabled={progressEnabled} />
          </ClerkIsland>
        </HeaderPartBoundary>
      </li>
    </>
  );
}

export function ShadcnAccountTools({ signInHref }: { signInHref: string }) {
  return (
    <Suspense
      fallback={
        // While the page works out who's looking: Sign in for a visitor, or the bell,
        // Dashboard and avatar shapes for someone signed in. html[data-remembered-in]
        // (set before the first paint) picks which (shadcnio.css), so the right one
        // shows from the start and is simply filled in.
        <>
          <li className="globalnav-item globalnav-item-icon globalnav-account" data-gn-audience="visitor">
            <a className={PILL} href={signInHref}>
              Sign in
            </a>
          </li>
          <li className="globalnav-item globalnav-item-icon globalnav-bell" data-gn-audience="member">
            <BellPlaceholder />
          </li>
          <li className="globalnav-item globalnav-item-icon globalnav-account globalnav-dashboard" data-gn-audience="member">
            <Link className={PILL} href="/overview">
              Dashboard
            </Link>
          </li>
          <li className="globalnav-item globalnav-item-icon globalnav-avatar-item" data-gn-audience="member">
            <AvatarPlaceholder />
          </li>
        </>
      }
    >
      <AccountTools signInHref={signInHref} />
    </Suspense>
  );
}
