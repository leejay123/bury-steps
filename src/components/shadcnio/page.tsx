import Link from "next/link";
import { ArrowRight, Footprints } from "lucide-react";
import { getHomepageTestimonials } from "@/lib/homepage-testimonials";
import { getHomepageFaqData } from "@/lib/homepage-faqs";
import { getInlineLogo } from "@/lib/inline-logo";
import type { SiteTheme } from "@/lib/site-theme";
import { AFTER_AUTH_PATH, accountPortalHref, appUrl } from "@/lib/urls";
import { copyrightYear } from "@/components/site-footer";
import { GlobalNav, type GlobalNavLink, type SearchItem } from "./globalnav";
import { GlobalFooter, type FooterGroup } from "./globalfooter";
import { ShadcnHome } from "./home";
import { getShadcnHomeData } from "./home-data";
import { PromoBar } from "./promo-bar";
import { ShadcnAccountTools } from "./account-tools";
import { HomeAboutDrawer } from "@/components/home-about-drawer";
import { BUTTON_PRIMARY } from "./parts";

/**
 * The whole homepage in the shadcn.io site design — their announcement bar,
 * header, page, footer and bottom bar, laid out exactly as on shadcn.io (used
 * with their permission) with Bury Steps' own words, links and data. The
 * site's usual header and footer step aside on this page (globals.css:
 * [data-shadcnio-home]).
 */
export async function ShadcnHomePage({ theme }: { theme: SiteTheme }) {
  const [data, testimonials, faqData, logo, year] = await Promise.all([
    getShadcnHomeData(),
    getHomepageTestimonials(),
    getHomepageFaqData(),
    getInlineLogo(),
    copyrightYear(),
  ]);
  const afterAuth = `${appUrl()}${AFTER_AUTH_PATH}`;
  const joinHref = accountPortalHref("sign-up", afterAuth);
  const signInHref = accountPortalHref("sign-in", afterAuth);
  const facebookUrl = theme.facebookGroupUrl.trim();

  const links: GlobalNavLink[] = [
    { href: "/", label: "Home" },
    { href: "/walks", label: "Walks" },
    { href: "/contact", label: "Contact us" },
    { href: "/apps", label: "Walking apps" },
    ...(facebookUrl ? [{ href: facebookUrl, label: "Facebook group" }] : []),
  ];
  const search: SearchItem[] = [
    { href: "/walks", label: "Walks", caption: "Coming up", scope: "pages" },
    { href: "/notices", label: "Notices", scope: "pages" },
    { href: "/progress", label: "Group progress", scope: "pages" },
    { href: "/history", label: "Your walk history", scope: "pages" },
    { href: "/contact", label: "Contact us", scope: "pages" },
    { href: "/apps", label: "Walking apps", scope: "pages" },
    { href: "/email-preferences", label: "Email preferences", scope: "pages" },
    { href: "/dashboard", label: "Dashboard", scope: "pages" },
    ...data.upcoming.map((walk) => ({ href: walk.href, label: walk.title, caption: walk.when, scope: "walks" as const })),
    ...faqData.faqs.map((faq) => ({ href: "/#faq", label: faq.question, caption: faq.categoryLabel, scope: "questions" as const })),
  ];
  const columns: FooterGroup[][] = [
    [
      {
        id: "explore",
        title: "Explore",
        links: [
          { href: "/", label: "Home" },
          { href: "/walks", label: "Walks" },
          { href: "/notices", label: "Notices" },
          { href: "/progress", label: "Progress" },
          { href: "/history", label: "Your history" },
        ],
      },
    ],
    [
      {
        id: "group",
        title: "The group",
        links: [
          { href: "/contact", label: "Contact us" },
          { href: "/apps", label: "Walking apps" },
          ...(facebookUrl ? [{ href: facebookUrl, label: "Facebook group" }] : []),
        ],
      },
    ],
    [
      {
        id: "help",
        title: "Help",
        links: [
          { href: "/#faq", label: "Questions people ask" },
          { href: "/#home-how-heading", label: "How it works" },
          { href: "/#home-rules-heading", label: "Group rules" },
        ],
      },
    ],
    [
      {
        id: "account",
        title: "Account",
        links: [
          { href: signInHref, label: "Sign in" },
          { href: joinHref, label: "Join the group" },
          { href: "/email-preferences", label: "Email preferences" },
          { href: "/dashboard", label: "Dashboard" },
        ],
      },
    ],
    [
      {
        id: "legal",
        title: "Legal",
        links: [
          { href: "/privacy-policy", label: "Privacy Policy" },
          { href: "/terms-of-service", label: "Terms of Service" },
        ],
      },
    ],
  ];
  const announcement = theme.announcementEnabled && theme.announcementText ? theme.announcementText : null;

  return (
    <div className="style-nova theme-neutral radius-default flex min-h-dvh flex-col" data-shadcnio-home="">
      <aside aria-label="Announcement" className="border-b lg:relative lg:z-41">
        <Link
          className="bg-muted/60 transition-none group flex h-10 items-center justify-center gap-2 px-4 text-sm outline-none hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:gap-3"
          href={announcement ? theme.announcementLink || "/walks" : joinHref}
        >
          <span className="flex shrink-0 items-center gap-2">
            <Footprints aria-hidden className="size-4" />
          </span>
          <span className="min-w-0 truncate">
            {announcement ? (
              <span className="font-medium">{announcement}</span>
            ) : (
              <>
                <span className="font-medium">
                  New here<span className="max-sm:hidden">? Come for a walk</span>.
                </span>{" "}
                <span className="text-muted-foreground lg:hidden">· Free</span>
                <span className="text-muted-foreground max-lg:hidden">
                  Joining is free, and every walk goes at the pace of the group.
                </span>
              </>
            )}
          </span>
          <span className="flex shrink-0 items-center gap-1.5 font-medium">
            <span className="underline-offset-4 group-hover:underline max-sm:hidden">{announcement ? "See more" : "Join free"}</span>
            <ArrowRight aria-hidden className="size-4 text-muted-foreground group-hover:text-foreground rtl:rotate-180" />
          </span>
        </Link>
      </aside>
      <GlobalNav
        account={<ShadcnAccountTools signInHref={signInHref} />}
        facebookUrl={facebookUrl}
        links={links}
        logoSrc={logo.src}
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
                readMore: (
                  <HomeAboutDrawer
                    aboutExpect={theme.aboutExpect}
                    aboutExpectHeading={theme.aboutExpectHeading}
                    aboutGoals={theme.aboutGoals}
                    aboutGoalsHeading={theme.aboutGoalsHeading}
                    aboutPlaces={theme.aboutPlaces}
                    aboutPlacesHeading={theme.aboutPlacesHeading}
                    aboutRules={theme.aboutRules}
                    aboutRulesHeading={theme.aboutRulesHeading}
                    facebookGroupUrl={theme.facebookGroupUrl}
                    howThisStartedBody={theme.howThisStartedBody}
                    howThisStartedTitle={theme.howThisStartedTitle}
                    trigger={
                      <button className={`${BUTTON_PRIMARY} gap-2`} type="button">
                        Read more
                        <ArrowRight aria-hidden className="size-4 rtl:rotate-180" />
                      </button>
                    }
                  />
                ),
              }}
              data={data}
              essentials={theme.walkEssentials}
              expect={theme.aboutExpect}
              facebookUrl={facebookUrl}
              faqCategories={faqData.categories}
              faqs={faqData.faqs}
              goals={theme.aboutGoals}
              joinHref={joinHref}
              logo={logo}
              rules={theme.aboutRules}
              signInHref={signInHref}
              siteName={theme.siteName}
              tagline={theme.siteTagline}
              testimonials={testimonials}
            />
            <GlobalFooter columns={columns} facebookUrl={facebookUrl} siteName={theme.siteName} year={year} />
          </div>
        </div>
      </div>
      <PromoBar next={data.next} />
    </div>
  );
}
