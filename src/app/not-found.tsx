import { copyrightYear } from "@/components/site-footer";
import { NotFoundPage } from "@/components/not-found";
import { ShadcnLayoutFrame } from "@/components/shadcnio/layout-frame";
import { getSiteTheme } from "@/lib/site-theme";

/**
 * Unmatched addresses (not a page in (site)) don't get the dashboard layout,
 * so the shadcn.io design wraps this itself. A missing page under (site)
 * uses (site)/not-found.tsx instead, which already sits in the frame.
 */
export default async function NotFound() {
  const [theme, year] = await Promise.all([getSiteTheme(), copyrightYear()]);
  const page = <NotFoundPage />;
  if (theme.siteDesign === "shadcnio") {
    return (
      <ShadcnLayoutFrame theme={theme} year={year}>
        {page}
      </ShadcnLayoutFrame>
    );
  }
  return page;
}
