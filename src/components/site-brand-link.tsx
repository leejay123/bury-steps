import { getSiteTheme } from "@/lib/site-theme";
import { getInlineLogo } from "@/lib/inline-logo";
import { UnlockingLink } from "@/components/overlay-root";

export async function SiteBrandLink() {
  const [theme, logo] = await Promise.all([getSiteTheme(), getInlineLogo()]);
  return (
    <UnlockingLink className="flex h-8 min-w-0 shrink-0 items-center justify-self-start" href="/">
      {/* Built into the page (see getInlineLogo), not an image file: on a
          refresh a file appeared a frame or two after everything else. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt={theme.siteName}
        className="h-8 w-auto object-contain object-left"
        decoding="sync"
        height={logo.height}
        src={logo.src}
        width={logo.width}
      />
    </UnlockingLink>
  );
}
