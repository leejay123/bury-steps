import type * as React from "react";
import { ArrowRight, Facebook, Instagram, X, Youtube } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * @efferd/footer-4 — grid-based footer with social cards, link groups, and
 * copyright bar (https://efferd.com/blocks/footer).
 *
 * Installed by hand: this environment's network policy blocks efferd.com,
 * so `shadcn add @efferd/footer-4` can't fetch the block or its
 * `@efferd/*-icon` registry dependencies. Swapped those for lucide-react's
 * built-in Facebook/Instagram/X/Youtube icons — same marks, already a
 * project dependency.
 *
 * Not wired into the site yet — `SiteFooter` (site-footer.tsx) is still
 * the live footer.
 */
export function Footer4() {
  return (
    <footer
      className={cn(
        "border-t",
        "dark:bg-[radial-gradient(35%_128px_at_50%_0%,--theme(--color-foreground/.08),transparent)]",
      )}
    >
      <div className="relative mx-auto max-w-5xl px-4">
        <div className="relative grid grid-cols-1 border-x md:grid-cols-4 md:divide-x">
          <div>
            <SocialCard
              className="border-t-0"
              href="#"
              icon={<Facebook />}
              title="Facebook"
            />
            <LinksGroup
              links={[
                { title: "Pricing", href: "#" },
                { title: "Testimonials", href: "#" },
                { title: "FAQs", href: "#" },
                { title: "Contact Us", href: "#" },
                { title: "Blog", href: "#" },
              ]}
              title="About Us"
            />
          </div>
          <div>
            <SocialCard href="#" icon={<Youtube />} title="Youtube" />
            <LinksGroup
              links={[
                { title: "Help Center", href: "#" },
                { title: "Terms", href: "#" },
                { title: "Privacy", href: "#" },
                { title: "Security", href: "#" },
                { title: "Cookie Policy", href: "#" },
              ]}
              title="Support"
            />
          </div>
          <div>
            <SocialCard href="#" icon={<X />} title="Twitter" />
            <LinksGroup
              links={[
                { title: "Forum", href: "#" },
                { title: "Events", href: "#" },
                { title: "Partners", href: "#" },
                { title: "Affiliates", href: "#" },
                { title: "Career", href: "#" },
              ]}
              title="Community"
            />
          </div>
          <div>
            <SocialCard href="#" icon={<Instagram />} title="Instagram" />
            <LinksGroup
              links={[
                { title: "Investors", href: "#" },
                { title: "Terms of Use", href: "#" },
                { title: "Privacy Policy", href: "#" },
                { title: "Cookie Policy", href: "#" },
                { title: "Legal", href: "#" },
              ]}
              title="Press"
            />
          </div>
        </div>
      </div>
      <div className="flex justify-center border-t p-3">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} efferd, All rights reserved
        </p>
      </div>
    </footer>
  );
}

type LinksGroupProps = {
  title: string;
  links: { title: string; href: string }[];
};

function LinksGroup({ title, links }: LinksGroupProps) {
  return (
    <div className="p-2">
      <h3 className="mt-2 mb-3 text-[10px] font-light tracking-wider text-muted-foreground uppercase">
        {title}
      </h3>
      <ul>
        {links.map((link) => (
          <li key={link.title}>
            <a className="text-sm text-muted-foreground hover:text-foreground" href={link.href}>
              {link.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialCard({
  title,
  href,
  className,
  icon,
}: React.ComponentProps<"a"> & {
  title: string;
  icon?: React.ReactNode;
}) {
  return (
    <a
      className={cn(
        "flex items-center justify-between border-y p-2 text-sm hover:bg-muted md:border-t-0 dark:hover:bg-muted/50",
        className,
      )}
      href={href}
    >
      <span className="flex items-center gap-2 font-medium [&>svg]:size-3.5 [&>svg]:shrink-0">
        {icon}
        {title}
      </span>
      <ArrowRight className="size-4" />
    </a>
  );
}
