import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight, Mail, Scale, ShieldCheck } from "lucide-react";
import { GRID, Section, Tile } from "./parts";

export type ShadcnLegalSection = { id: string; title: string; content: ReactNode };

const DOCS = [
  { href: "/terms-of-service", title: "Terms", sub: "Your account and the rules", icon: <Scale /> },
  { href: "/privacy-policy", title: "Privacy", sub: "What we collect, and why", icon: <ShieldCheck /> },
  { href: "/contact", title: "Contact", sub: "Questions about either", icon: <Mail /> },
];

/**
 * A legal page laid out as shadcn.io's Terms page (their classes, used with
 * permission): a centred hero with the breadcrumb, the title and its icon,
 * a line and "Last updated · Ask a question"; the legal documents as tiles;
 * then each section numbered, its title on the left and the text on the right.
 */
export function ShadcnLegal({
  title,
  lead,
  rest,
  updated,
  sections,
  icon,
  current,
}: {
  title: string;
  lead: string;
  rest: string;
  updated: string;
  sections: ShadcnLegalSection[];
  icon: "terms" | "privacy";
  current: string;
}) {
  const [first, ...others] = title.split(" ");
  const Icon = icon === "terms" ? Scale : ShieldCheck;
  return (
    <div className="flex flex-1 flex-col" data-shadcn-page="" data-shadcn-plain="">
      <section aria-labelledby="legal-title" className="border-t first-of-type:border-t-0">
        <div
          className="px-5 md:px-12 flex flex-col items-center relative isolate justify-center min-h-[29rem] sm:min-h-[30rem] md:min-h-[36rem] lg:min-h-[35rem] xl:min-h-[34rem] gap-8 pt-6 pb-8 sm:pt-8 sm:pb-12 md:pt-10 md:pb-14"
          data-slot="hero"
        >
          <div className="flex flex-col max-w-4xl gap-4 md:gap-5 mx-auto min-w-0 items-center text-center">
            <div className="flex justify-center">
              <nav aria-label="breadcrumb" className="cn-breadcrumb" data-slot="breadcrumb">
                <ol className="cn-breadcrumb-list wrap-break-word flex flex-wrap items-center">
                  <li className="cn-breadcrumb-item inline-flex items-center">
                    <Link className="cn-breadcrumb-link" href="/">
                      Home
                    </Link>
                  </li>
                  <li aria-hidden="true" className="cn-breadcrumb-separator" role="presentation">
                    <ChevronRight />
                  </li>
                  <li className="cn-breadcrumb-item inline-flex items-center">
                    <span aria-current="page" className="cn-breadcrumb-page">
                      {title}
                    </span>
                  </li>
                </ol>
              </nav>
            </div>
            <h1
              className="text-balance font-semibold text-4xl leading-[1.05] tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl"
              id="legal-title"
            >
              <span className="whitespace-nowrap">
                <span
                  aria-hidden="true"
                  className="me-[0.18em] size-[0.82em] -translate-y-[0.05em] border border-foreground/[0.12] align-middle inline-flex items-center justify-center rounded-[0.24em] bg-background [&_svg]:size-[0.5em] [&_svg]:stroke-[1.5]"
                >
                  <Icon />
                </span>
                {first}
              </span>{" "}
              {others.join(" ")}
            </h1>
            <p className="max-w-2xl text-muted-foreground sm:text-lg md:text-xl text-balance">
              <span className="font-medium text-foreground">{lead}</span> {rest}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-muted-foreground text-sm">
              <span>
                Last updated <time className="font-medium text-foreground">{updated}</time>
              </span>
              <span aria-hidden="true">·</span>
              <Link
                className="inline-flex items-center gap-1 rounded-sm font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                href="/contact"
              >
                Ask a question
                <ArrowRight aria-hidden className="size-3.5" />
              </Link>
            </p>
          </div>
        </div>
      </section>
      <Section id="legal-documents">
        <nav aria-label="Legal documents">
          <h2 className="sr-only" id="legal-documents">
            Legal documents
          </h2>
          <ul className={GRID.replace("grid-cols-2 lg:grid-cols-4", "grid-cols-3")}>
            {DOCS.map((doc) => (
              <Tile
                className={doc.href === current ? "[&>*]:bg-muted/40" : undefined}
                href={doc.href}
                key={doc.href}
                sub={doc.sub}
                title={doc.title}
                visual={{ kind: "square", icon: doc.icon }}
              />
            ))}
          </ul>
        </nav>
      </Section>
      {sections.map((section, i) => (
        <Section id={`legal-${section.id}`} key={section.id}>
          <div
            className="px-5 md:px-12 grid gap-5 py-12 md:grid-cols-[12rem_minmax(0,1fr)] md:gap-10 md:py-16 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14"
            id={section.id}
          >
            <div className="flex flex-col gap-2 md:sticky md:top-[calc(var(--header-height)+2.5rem)] md:self-start">
              <span className="font-medium font-mono text-muted-foreground text-xs uppercase leading-4 tracking-widest">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2
                className="scroll-mt-(--header-height) text-balance font-semibold text-xl tracking-tight md:text-2xl"
                id={`legal-${section.id}`}
              >
                {section.title}
              </h2>
            </div>
            <div className="min-w-0 [&_.typeset-docs>:first-child]:mt-0">
              <div className="typeset typeset-docs w-full flex-1">{section.content}</div>
            </div>
          </div>
        </Section>
      ))}
    </div>
  );
}
