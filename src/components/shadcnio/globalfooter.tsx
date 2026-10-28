"use client";

import { useState } from "react";
import Link from "next/link";
import { FooterAppearance } from "./appearance";

export type FooterLink = { href: string; label: string };
export type FooterGroup = { id: string; title: string; links: FooterLink[] };

function FooterAnchor({ link, className }: { link: FooterLink; className?: string }) {
  return link.href.startsWith("http") ? (
    <a className={className} href={link.href} rel="noopener noreferrer" target="_blank">
      {link.label}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  ) : (
    <Link className={className} href={link.href}>
      {link.label}
    </Link>
  );
}

/**
 * shadcn.io's footer (their "globalfooter", used with their permission):
 * columns of links (rows that fold open on phones), a line of help, then the
 * copyright, legal links and the light / dark / device switch.
 */
export function GlobalFooter({
  columns,
  siteName,
  year,
  facebookUrl,
}: {
  /** Each column holds one or more groups, top to bottom. */
  columns: FooterGroup[][];
  siteName: string;
  year: number;
  facebookUrl: string;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  return (
    <footer aria-labelledby="globalfooter-label" className="globalfooter" data-motion="" role="contentinfo">
      <h2 className="sr-only" id="globalfooter-label">
        {siteName} footer
      </h2>
      <nav aria-label={`${siteName} directory`} className="globalfooter-directory">
        {columns.map((column, i) => (
          <div className="globalfooter-directory-column" key={i}>
            {column.map((group) => {
              const isOpen = Boolean(open[group.id]);
              return (
                <div className="group/collapsible globalfooter-directory-section" data-open={isOpen ? "" : undefined} key={group.id}>
                  <h3 className="globalfooter-directory-section-title">
                    <span className="globalfooter-directory-section-title-text">{group.title}</span>
                    <button
                      aria-controls={`globalfooter-${group.id}`}
                      aria-expanded={isOpen}
                      className="globalfooter-directory-section-title-button"
                      data-panel-open={isOpen ? "" : undefined}
                      onClick={() => setOpen((state) => ({ ...state, [group.id]: !isOpen }))}
                      type="button"
                    >
                      {group.title}
                      <svg aria-hidden="true" className="globalfooter-directory-section-icon" viewBox="0 0 11 6">
                        <polyline
                          fill="none"
                          points="10.075 0.675 5.5 5.323 0.925 0.675"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </h3>
                  <div
                    className="overflow-hidden globalfooter-directory-section-panel"
                    id={`globalfooter-${group.id}`}
                    style={{ "--collapsible-panel-height": isOpen ? "auto" : "0px" } as React.CSSProperties}
                  >
                    <ul className="globalfooter-directory-section-list">
                      {group.links.map((link) => (
                        <li className="globalfooter-directory-section-item" key={link.label}>
                          <FooterAnchor className="globalfooter-directory-section-link" link={link} />
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </nav>
      <p className="globalfooter-shop">
        Questions about a walk? <Link href="/contact">Contact us</Link> or <Link href="/walks">see the walks</Link>.{" "}
        {facebookUrl ? (
          <span className="nowrap">
            Or ask the group on{" "}
            <a href={facebookUrl} rel="noopener noreferrer" target="_blank">
              Facebook<span className="sr-only"> (opens in a new tab)</span>
            </a>
            .
          </span>
        ) : null}
      </p>
      <div className="globalfooter-end">
        <div className="globalfooter-legal">
          <p className="globalfooter-legal-copyright">
            Copyright © {year} {siteName}.
          </p>
          <ul className="globalfooter-legal-links">
            <li className="globalfooter-legal-links-item">
              <Link href="/privacy-policy">Privacy Policy</Link>
            </li>
            <li className="globalfooter-legal-links-item">
              <Link href="/terms-of-service">Terms of Service</Link>
            </li>
            <li className="globalfooter-legal-links-item">
              <Link href="/contact">Contact</Link>
            </li>
          </ul>
        </div>
        <FooterAppearance />
      </div>
    </footer>
  );
}
