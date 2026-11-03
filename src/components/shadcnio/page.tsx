import Link from "next/link";
import { ArrowRight, Footprints } from "lucide-react";
import { getHomepageTestimonials } from "@/lib/homepage-testimonials";
import { getHomepageFaqData } from "@/lib/homepage-faqs";
import { getInlineLogo } from "@/lib/inline-logo";
import type { SiteTheme } from "@/lib/site-theme";
import { copyrightYear } from "@/components/site-footer";
import { GlobalNav, type SearchItem } from "./globalnav";
import { GlobalFooter } from "./globalfooter";
import { ShadcnHome } from "./home";
import { getShadcnHomeData } from "./home-data";
import { PromoBar } from "./promo-bar";
import { ShadcnAccountTools } from "./account-tools";
import { siteChrome } from "./chrome";
import { ShadcnNewsletter } from "./newsletter";
import { getOptionalUser } from "@/lib/auth";
import { getProgressEnabled } from "@/lib/progress-settings";
import { Suspense } from "react";
import { PageKindMark } from "./page-kind";

/**
 * The whole homepage in the shadcn.io site design — join bar, header, page,
 * footer and bottom bar, laid out exactly as on shadcn.io (used with their
 * permission) with Bury Steps' own words, links and data. It lives outside
 * the dashboard layout (`src/app/page.tsx`, not `(site)`), so it doesn't
 * download a hidden copy of that shell. The join bar can be turned off
 * under Settings → Site behaviour.
 */
export async function ShadcnHomePage({ theme }: { theme: SiteTheme }) {
  const [data, testimonials, faqData, logo, year, progressEnabled] = await Promise.all([
    getShadcnHomeData(),
    getHomepageTestimonials(),
    getHomepageFaqData(),
    getInlineLogo(),
    copyrightYear(),
    getProgressEnabled(),
  ]);
  const chrome = siteChrome(theme);
  const { links, columns, joinHref, signInHref, facebookUrl } = chrome;
  const search: SearchItem[] = [
    ...chrome.search,
    ...data.upcoming.map((walk) => ({ href: walk.href, label: walk.title, caption: walk.when, scope: "walks" as const })),
    ...faqData.faqs.map((faq) => ({ href: "/#faq", label: faq.question, caption: faq.categoryLabel, scope: "questions" as const })),
  ];
  return (
    <div className="style-nova theme-neutral radius-default flex min-h-dvh flex-col" data-shadcnio-home="">
      <PageKindMark kind="home" />
      {theme.announcementEnabled ? (
        <aside aria-label="Join the group" className="border-b lg:relative lg:z-41">
          <Link
            className="bg-muted/60 transition-none group flex h-10 items-center justify-center gap-2 px-4 text-sm outline-none hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:gap-3"
            href={joinHref}
          >
            <span className="flex shrink-0 items-center gap-2">
              <Footprints aria-hidden className="size-4" />
            </span>
            <span className="min-w-0 truncate">
              <span className="font-medium">
                New here<span className="max-sm:hidden">? Come for a walk</span>.
              </span>{" "}
              <span className="text-muted-foreground lg:hidden">· Free</span>
              <span className="text-muted-foreground max-lg:hidden">
                Joining is free, and every walk goes at the pace of the group.
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-1.5 font-medium">
              <span className="underline-offset-4 group-hover:underline max-sm:hidden">Join free</span>
              <ArrowRight aria-hidden className="size-4 text-muted-foreground group-hover:text-foreground rtl:rotate-180" />
            </span>
          </Link>
        </aside>
      ) : null}
      <GlobalNav
        account={<ShadcnAccountTools signInHref={signInHref} />}
        facebookUrl={facebookUrl}
        links={links}
        logoSrc={logo.src}
        progressEnabled={progressEnabled}
        search={search}
        siteName={theme.siteName}
      />
      <div className="flex w-full flex-1 flex-col overflow-x-clip">
        <div className="mx-auto max-w-3xl px-4 sm:px-5 lg:max-w-6xl lg:px-6 flex w-full flex-1 flex-col">
          <div className="flex flex-1 scroll-mt-(--header-height) flex-col border-x outline-none" id="content" tabIndex={-1}>
            <ShadcnHome
              about={{
                title: theme.howThisStartedTitle,
                teaser: theme.howThisStartedTeaser,
              }}
              data={data}
              expect={theme.aboutExpect}
              facebookUrl={facebookUrl}
              faqCategories={faqData.categories}
              faqs={faqData.faqs}
              goals={theme.aboutGoals}
              joinHref={joinHref}
              logo={logo}
              signInHref={signInHref}
              siteName={theme.siteName}
              tagline={theme.siteTagline}
              testimonials={testimonials}
            />
            <Suspense fallback={null}>
              <MemberNewsletter />
            </Suspense>
            <GlobalFooter columns={columns} facebookUrl={facebookUrl} siteName={theme.siteName} year={year} />
          </div>
        </div>
      </div>
      <PromoBar next={data.next} />
    </div>
  );
}

/** The newsletter band for signed-in members only (as the usual footer does). */
async function MemberNewsletter() {
  const user = await getOptionalUser();
  return user ? <ShadcnNewsletter /> : null;
}
