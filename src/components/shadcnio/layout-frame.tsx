import { Suspense, type ReactNode } from "react";
import type { SiteTheme } from "@/lib/site-theme";
import { getInlineLogo } from "@/lib/inline-logo";
import { ShadcnAccountTools } from "./account-tools";
import { siteChrome } from "./chrome";
import { DashSidebarParts } from "./dash-sidebar";
import { GlobalFooter } from "./globalfooter";
import { GlobalNav, type SearchItem } from "./globalnav";
import { getShadcnHomeData } from "./home-data";
import { ShadcnSiteShell } from "./site-shell";
import { TopLoader } from "./top-loader";

/** The sidebar's shape while it loads (signed-in members only ever see it). */
function SidebarSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-1 flex-col">
      <div className="flex h-14 items-center gap-3 border-b px-4">
        <span className="size-8 rounded-md bg-muted" />
        <span className="h-3 w-32 rounded bg-muted" />
      </div>
      <div className="flex flex-col gap-3 px-4 pt-5">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <span
            className="h-3 rounded bg-muted"
            key={i}
            style={{ width: `${55 + ((i * 13) % 35)}%` }}
          />
        ))}
      </div>
    </div>
  );
}

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
  const [logo, data] = await Promise.all([
    getInlineLogo(),
    getShadcnHomeData(),
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
    <TopLoader>
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
            search={search}
            sidebar
            siteName={theme.siteName}
          />
        }
        sidebar={
          <Suspense fallback={<SidebarSkeleton />}>
            <DashSidebarParts siteName={theme.siteName} />
          </Suspense>
        }
      >
        {children}
      </ShadcnSiteShell>
      {/* The end of the frame: the first paint waits for it (layout.tsx, rel="expect"). */}
      <div hidden id="bs-frame-end" />
    </TopLoader>
  );
}
