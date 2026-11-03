"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { AvatarPlaceholder } from "@/components/header-placeholders";
import { AVATAR_IMAGE_COOKIE } from "@/lib/remembered-nav";
import { writeClientCookie } from "@/lib/remembered-rows-key";

/**
 * The avatar: clicking it opens Clerk's own account window (Clerk's
 * openUserProfile()), and nothing else. Drawn by the site with the remembered
 * photo from the first paint, so it isn't swapped for Clerk's button when Clerk
 * loads (no flash).
 */
export function SiteUserButton({
  image,
  initial,
}: {
  /** Last visit's photo, shown from the first paint. */
  image?: string | null;
  /** Shown in the circle when there's no photo. */
  initial?: string;
  /** No longer used (the account menu that linked to Progress is gone). */
  progressEnabled?: boolean;
}) {
  const { user } = useUser();
  const { openUserProfile } = useClerk();

  // Remember the photo so the next refresh can show it straight away.
  const imageUrl = user?.imageUrl;
  useEffect(() => {
    if (imageUrl) writeClientCookie(AVATAR_IMAGE_COOKIE, encodeURIComponent(imageUrl));
  }, [imageUrl]);

  // The server draws the remembered photo (Clerk isn't loaded there); keep it until this
  // part of the page has woken up, so the browser's first draw matches the server's.
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const photo = (hydrated ? imageUrl : null) ?? image ?? null;

  return (
    <button
      aria-label="Manage account"
      className="relative flex size-7 shrink-0 cursor-pointer rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      data-account-button=""
      onClick={() => openUserProfile()}
      type="button"
    >
      <AvatarPlaceholder image={photo} initial={initial || user?.firstName?.charAt(0) || "?"} />
    </button>
  );
}

function noopSubscribe() {
  return () => {};
}
