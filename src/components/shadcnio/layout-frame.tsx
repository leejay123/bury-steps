import type { ReactNode } from "react";
import type { SiteTheme } from "@/lib/site-theme";
import { getInlineLogo } from "@/lib/inline-logo";
import { getProgressEnabled } from "@/lib/progress-settings";
import { ShadcnAccountTools } from "./account-tools";
import { siteChrome } from "./chrome";
import { EfferdHeaderTools, EfferdSidebarBody, EfferdSidebarHead } from "./efferd-sidebar";
import { GlobalFooter } from "./globalfooter";
import { GlobalNav, type SearchItem } from "./globalnav";
import { getShadcnHomeData } from "./home-data";
import { ShadcnSiteShell } from "./site-shell";

/**
 * Every page but the homepage in the shadcn.io design: their header, their
 * dashboard sidebar for signed-in members, their framed page and (for
 * everyone else) their footer.
 */
export async function ShadcnLayoutFrame({
  theme,
  year,
  children,
}: {
  theme: SiteTheme;
  year: number;
  children: ReactNode;
}) {
  const [logo, data, progressEnabled] = await Promise.all([
    getInlineLogo(),
    getShadcnHomeData(),
    getProgressEnabled(),
  ]);
  const { links, columns, signInHref, facebookUrl, ...chrome } =
    siteChrome(theme);
  const search: SearchItem[] = [
    ...chrome.search,
    ...data.upcoming.map((walk) => ({
      href: walk.href,
      label: walk.title,
      caption: walk.when,
      scope: "walks" as const,
    })),
  ];
  return (
    <ShadcnSiteShell
      footer={
        <GlobalFooter
          columns={columns}
          facebookUrl={facebookUrl}
          siteName={theme.siteName}
          year={year}
        />
      }
      nav={
        <GlobalNav
          account={<ShadcnAccountTools signInHref={signInHref} />}
          facebookUrl={facebookUrl}
          links={links}
          logoSrc={logo.src}
          progressEnabled={progressEnabled}
          search={search}
          sidebar
          siteName={theme.siteName}
        />
      }
      sidebar={
        <>
          <EfferdSidebarHead logoSrc={logo.src} siteName={theme.siteName} />
          <EfferdSidebarBody data={data} progressEnabled={progressEnabled} />
        </>
      }
      tools={<EfferdHeaderTools signInHref={signInHref} />}
    >
      {children}
    </ShadcnSiteShell>
  );
}
