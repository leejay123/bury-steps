import type { ReactNode } from "react";
import { copyrightYear } from "@/components/site-footer";
import { ShadcnLayoutFrame } from "@/components/shadcnio/layout-frame";
import { getSiteTheme } from "@/lib/site-theme";

/**
 * Every page except the homepage. The homepage lives outside this group
 * (`src/app/page.tsx`) and draws its own header and footer, so it doesn't
 * download a hidden copy of this shell.
 */
export default async function SiteLayout({ children }: { children: ReactNode }) {
  const theme = await getSiteTheme();
  const year = await copyrightYear();
  return <ShadcnLayoutFrame theme={theme} year={year}>{children}</ShadcnLayoutFrame>;
}
