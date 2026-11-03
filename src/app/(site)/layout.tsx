import type { ReactNode } from "react";
import { copyrightYear } from "@/components/site-footer";
import { ShadcnLayoutFrame } from "@/components/shadcnio/layout-frame";
import { getSiteTheme } from "@/lib/site-theme";

/**
 * Every page except the homepage. In the shadcn.io design this is their
 * dashboard frame (header, signed-in sidebar, footer). The homepage lives
 * outside this group (`src/app/page.tsx`) and draws its own header and
 * footer, so it doesn't download a hidden copy of this shell.
 *
 * Original design: the root layout already has the site's header and footer,
 * so this is a pass-through.
 */
export default async function SiteLayout({ children }: { children: ReactNode }) {
  const theme = await getSiteTheme();
  if (theme.siteDesign !== "shadcnio") return children;
  const year = await copyrightYear();
  return <ShadcnLayoutFrame theme={theme} year={year}>{children}</ShadcnLayoutFrame>;
}
