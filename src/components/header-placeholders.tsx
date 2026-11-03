/**
 * What the header shows for the bell and the account picture until the real
 * ones are ready. They must look exactly like the real ones, or a refresh
 * flashes: the picture used to be a grey letter that turned into the
 * member's photo once Clerk loaded, and the bell went grey → empty → black.
 * The same markup is copied into the boot script (header-boot.tsx).
 */

/** Same shape as the real bell (spectrumui/notification-bell.tsx). */
export const BELL_DOME_PATH = "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9";
export const BELL_CLAPPER_PATH = "M10.3 21a1.94 1.94 0 0 0 3.4 0";

export function BellPlaceholder() {
  return (
    <span aria-hidden className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-foreground">
      <svg
        aria-hidden="true"
        fill="none"
        height={16}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width={16}
      >
        <path d={BELL_DOME_PATH} />
        <path d={BELL_CLAPPER_PATH} />
      </svg>
    </span>
  );
}

/** The member's photo from last visit (same address Clerk's button uses, so it's already cached), else their initial. */
export function AvatarPlaceholder({ image, initial }: { image?: string | null; initial?: string | null }) {
  if (image) {
    // Asked for exactly as Clerk's button asks for it (the same sized copies, the same
    // crossorigin), so when the button takes over its photo is already downloaded and
    // nothing flashes. A plain imageUrl is a different address to the browser.
    // https://clerk.com/docs/guides/development/image-optimization
    const sized = /^https:\/\/img\.clerk\.com\//.test(image) && !image.includes("?");
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt=""
        aria-hidden
        className="size-7 shrink-0 rounded-full object-cover"
        crossOrigin="anonymous"
        src={sized ? `${image}?width=160` : image}
        srcSet={sized ? `${image}?width=80 1x,${image}?width=160 2x` : undefined}
      />
    );
  }
  return (
    <span
      aria-hidden
      className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground uppercase"
    >
      {initial}
    </span>
  );
}
