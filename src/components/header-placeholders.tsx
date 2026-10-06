import {
  AVATAR_BOX_CLASS,
  AVATAR_IMAGE_CLASS,
  BELL_BADGE_CLASS,
  BELL_BADGE_COUNT_CLASS,
  BELL_BUTTON_CLASS,
  BELL_CLAPPER_PATH,
  BELL_DOME_PATH,
  BELL_ICON_SIZE,
  bellBadgeText,
  clerkAvatarSources,
} from "@/components/header-chrome";

/**
 * What the header shows for the bell and the avatar until the real ones are
 * ready: the notices (the bell) and Clerk's code (the avatar menu) load
 * separately. Drawn exactly like the real ones, with last visit's unread
 * count and photo, so nothing changes when they arrive. The script that
 * draws the header before the page loads (header-boot.tsx) draws the same.
 *
 * No hooks, so both server and browser components can use these.
 */
export function BellPlaceholder({ unread = 0 }: { unread?: number }) {
  return (
    <span aria-hidden className={BELL_BUTTON_CLASS}>
      <span className="inline-flex">
        <svg
          fill="none"
          height={BELL_ICON_SIZE}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width={BELL_ICON_SIZE}
        >
          <path d={BELL_DOME_PATH} />
          <path d={BELL_CLAPPER_PATH} />
        </svg>
      </span>
      {unread > 0 ? (
        <span className={BELL_BADGE_CLASS}>
          <span className={BELL_BADGE_COUNT_CLASS}>
            <span className="inline-block">{bellBadgeText(unread)}</span>
          </span>
        </span>
      ) : null}
    </span>
  );
}

export function AvatarPlaceholder({ imageUrl, initial }: { imageUrl?: string | null; initial?: string }) {
  if (imageUrl) {
    const { src, srcSet } = clerkAvatarSources(imageUrl);
    return (
      <span aria-hidden className={AVATAR_BOX_CLASS}>
        {/* Not next/image: this is the exact request Clerk's avatar makes
            (same address and crossorigin), so its picture is already loaded. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" className={AVATAR_IMAGE_CLASS} crossOrigin="anonymous" src={src} srcSet={srcSet} />
      </span>
    );
  }
  return (
    <span aria-hidden className={AVATAR_BOX_CLASS}>
      {initial}
    </span>
  );
}
