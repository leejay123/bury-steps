import type { SiteTheme } from "@/lib/site-theme";
import { AFTER_AUTH_PATH, accountPortalHref, appUrl } from "@/lib/urls";
import type { FooterGroup } from "./globalfooter";
import type { GlobalNavLink, SearchItem } from "./globalnav";

/**
 * The shadcn.io design's header and footer lists, shared by the homepage and
 * every other page: the visitor's menu, the search's pages, and the footer's
 * columns of links.
 */
export function siteChrome(theme: SiteTheme) {
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
  return { links, search, columns, joinHref, signInHref, facebookUrl };
}
