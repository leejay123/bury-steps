import { getSiteTheme } from "@/lib/site-theme";
import { appUrl } from "@/lib/urls";

export type EmailBrand = {
  siteName: string;
  logoUrl: string;
  siteUrl: string;
};

/**
 * The bits of EmailLayoutProps every template needs and none of them should
 * fetch themselves — one call per send, shared across whichever templates
 * that send happens to use.
 */
export async function getEmailBrand(): Promise<EmailBrand> {
  const theme = await getSiteTheme();
  const site = appUrl();
  return {
    siteName: theme.siteName,
    logoUrl: `${site}${theme.logoSrc}`,
    siteUrl: site,
  };
}
