import { Suspense } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { ColorModeSwitch } from "@/components/color-mode";
import { FooterWordmark } from "@/components/footer-wordmark";
import { NewsletterFooterGate } from "@/components/newsletter-footer-gate";
import { getOptionalUser } from "@/lib/auth";
import { getProgressEnabled } from "@/lib/progress-settings";
import type { SiteTheme } from "@/lib/site-theme";
import { AFTER_AUTH_PATH, accountPortalHref, appUrl } from "@/lib/urls";

type FooterLink = { href: string; label: string; external?: boolean };
type FooterGroup = { title: string; links: FooterLink[] };

const linkClass = "text-foreground/80 transition-colors hover:text-foreground";

function FooterAnchor({ link, className }: { link: FooterLink; className?: string }) {
  return link.external ? (
    <a className={className} href={link.href} rel="noopener noreferrer" target="_blank">
      {link.label}
    </a>
  ) : (
    <Link className={className} href={link.href}>
      {link.label}
    </Link>
  );
}

/**
 * The footer in the shadcn.io site design, laid out as on shadcn.io: link
 * columns inside the framed column (on phones, one fold-open row per
 * column), a line of help underneath, then the copyright, legal links and
 * the light/dark/device switch.
 */
export function ShadcnFooter({ theme, year }: { theme: SiteTheme; year: number }) {
  const facebookUrl = theme.facebookGroupUrl.trim();
  return (
    <footer className="relative z-10 shrink-0" data-site-footer="" data-shadcn-footer="">
      <Suspense fallback={null}>
        <FooterNewsletter />
      </Suspense>
      <Suspense fallback={<FooterBody facebookUrl={facebookUrl} groups={null} theme={theme} year={year} />}>
        <FooterWithMembers facebookUrl={facebookUrl} theme={theme} year={year} />
      </Suspense>
      {theme.footerWordmarkEnabled ? <FooterWordmark showOnPhones={theme.footerWordmarkMobile} /> : null}
    </footer>
  );
}

async function FooterNewsletter() {
  const user = await getOptionalUser();
  if (!user) return null;
  return <NewsletterFooterGate />;
}

async function FooterWithMembers({ facebookUrl, theme, year }: { facebookUrl: string; theme: SiteTheme; year: number }) {
  const [user, progressEnabled] = await Promise.all([getOptionalUser(), getProgressEnabled()]);
  const afterAuth = `${appUrl()}${AFTER_AUTH_PATH}`;
  const members: FooterGroup | null = user
    ? {
        title: "Members",
        links: [
          { href: user.role === "ADMIN" ? "/admin/walks" : "/walks", label: "Walks" },
          { href: "/notices", label: "Notices" },
          ...(progressEnabled ? [{ href: "/progress", label: "Progress" }] : []),
          { href: "/history", label: "Your history" },
          { href: "/dashboard", label: "Dashboard" },
        ],
      }
    : null;
  const account: FooterGroup = user
    ? { title: "Account", links: [{ href: "/email-preferences", label: "Email preferences" }] }
    : {
        title: "Account",
        links: [
          { href: accountPortalHref("sign-in", afterAuth), label: "Sign in", external: false },
          { href: accountPortalHref("sign-up", afterAuth), label: "Join the group", external: false },
        ],
      };
  return (
    <FooterBody
      facebookUrl={facebookUrl}
      groups={[...(members ? [members] : []), account]}
      theme={theme}
      year={year}
    />
  );
}

function FooterBody({
  facebookUrl,
  groups,
  theme,
  year,
}: {
  facebookUrl: string;
  /** The signed-in parts (null while the session is checked). */
  groups: FooterGroup[] | null;
  theme: SiteTheme;
  year: number;
}) {
  const all: FooterGroup[] = [
    {
      title: "Explore",
      links: [
        { href: "/", label: "Home" },
        { href: "/contact", label: "Contact us" },
        { href: "/apps", label: "Walking apps" },
      ],
    },
    ...(facebookUrl ? [{ title: "Community", links: [{ href: facebookUrl, label: "Facebook group", external: true }] }] : []),
    ...(groups ?? []),
    {
      title: "Legal",
      links: [
        { href: "/privacy-policy", label: "Privacy Policy" },
        { href: "/terms-of-service", label: "Terms of Service" },
      ],
    },
  ];
  return (
    <div className="mx-auto w-[min(69rem,calc(100%-2rem))] border-x border-t bg-(--site-footer-bg) text-sm">
      {/* Computers and tablets: the columns side by side. */}
      <div className="hidden grid-cols-5 px-12 pt-6 md:grid">
        {all.map((group) => (
          <div className="flex flex-col gap-[11px] pr-6" key={group.title}>
            <h3 className="font-medium text-foreground">{group.title}</h3>
            <ul className="flex flex-col gap-[11px]">
              {group.links.map((link) => (
                <li key={link.label}>
                  <FooterAnchor className={linkClass} link={link} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {/* Phones: one row per column that folds open. */}
      <div className="md:hidden">
        {all.map((group) => (
          <details className="group border-b" key={group.title}>
            <summary className="flex h-[45px] cursor-pointer list-none items-center justify-between px-5 text-foreground [&::-webkit-details-marker]:hidden">
              {group.title}
              <ChevronDown aria-hidden className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <ul className="flex flex-col pb-2">
              {group.links.map((link) => (
                <li key={link.label}>
                  <FooterAnchor className={`${linkClass} flex h-[35px] items-center px-5`} link={link} />
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
      <p className="px-5 pt-6 text-muted-foreground md:px-12 md:pt-12">
        Questions about a walk?{" "}
        <Link className="text-foreground underline underline-offset-4" href="/contact">
          Contact us
        </Link>
        {facebookUrl ? (
          <>
            {" "}or ask the group on{" "}
            <a className="text-foreground underline underline-offset-4" href={facebookUrl} rel="noopener noreferrer" target="_blank">
              Facebook
            </a>
          </>
        ) : null}
        .
      </p>
      <div className="mt-6 flex flex-col gap-4 border-t px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-muted-foreground md:flex-row md:items-center md:justify-between md:px-12">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-7">
          <p>
            Copyright © {year} {theme.siteName}.
          </p>
          <ul className="flex items-center [&>li+li]:before:mx-2.5 [&>li+li]:before:text-border [&>li+li]:before:content-['|']">
            <li>
              <Link className={linkClass} href="/privacy-policy">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link className={linkClass} href="/terms-of-service">
                Terms of Service
              </Link>
            </li>
          </ul>
        </div>
        <ColorModeSwitch className="self-start md:self-auto" />
      </div>
    </div>
  );
}
