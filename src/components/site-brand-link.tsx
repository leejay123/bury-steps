import { getSiteTheme } from "@/lib/site-theme";
import { SiteLogo } from "@/components/site-logo";
import { UnlockingLink } from "@/components/overlay-root";

export async function SiteBrandLink() {
  const theme = await getSiteTheme();
  return (
    <UnlockingLink className="flex h-8 min-w-0 shrink-0 items-center justify-self-start" href="/">
      {/* No blur preview: the logo is already saved on a refresh, and the blur showed for a moment first. */}
      <SiteLogo alt={theme.siteName} src={theme.logoSrc} />
    </UnlockingLink>
  );
}
