import { getSiteTheme } from "@/lib/site-theme";
import { SiteLogo } from "@/components/site-logo";
import { UnlockingLink } from "@/components/overlay-root";

export async function SiteBrandLink() {
  const theme = await getSiteTheme();
  return (
    <UnlockingLink className="flex h-8 min-w-0 items-center justify-self-start" href="/">
      <SiteLogo alt={theme.siteName} />
    </UnlockingLink>
  );
}
