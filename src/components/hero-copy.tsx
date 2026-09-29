import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SectionBackground } from "@/components/section-background";
import { SectionTitle } from "@/components/section-title";
import type { SectionBgPattern } from "@/lib/section-background";

export function HeroCopy({
  eyebrow = "Support · Together · Empathy · Pace · Steps",
  title,
  titleAs: Title = "h1",
  children,
  actions,
  after,
  bgPattern = "none",
}: {
  eyebrow?: string | null;
  title: string;
  titleAs?: "h1" | "h2";
  children: ReactNode;
  actions?: ReactNode;
  after?: ReactNode;
  /** "none" keeps this section's original look — a soft ambient glow, not
   * literally nothing (see the fallback div below). */
  bgPattern?: SectionBgPattern;
}) {
  const sectionHeading = Title === "h2";

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center gap-5 px-4 md:px-6",
        // The homepage hero (h1) stays large. Section headings — How this
        // started, FAQs, testimonials, notices — used the same scale and
        // read as a second hero on desktop.
        sectionHeading ? "py-10 md:py-14" : "py-12 md:py-20 lg:py-24",
      )}
    >
      <div aria-hidden="true" className="absolute inset-0 -z-1 size-full overflow-hidden">
        {bgPattern === "none" ? (
          <div
            className={cn(
              "absolute -inset-x-20 inset-y-0 z-0 rounded-full",
              "bg-[radial-gradient(ellipse_at_center,theme(--color-foreground/.08),transparent,transparent)]",
            )}
          />
        ) : (
          <SectionBackground pattern={bgPattern} />
        )}
      </div>

      {eyebrow ? (
        <p className="text-center text-xs font-medium tracking-[0.18em] text-primary uppercase">{eyebrow}</p>
      ) : null}

      {sectionHeading ? (
        <SectionTitle
          className="max-w-3xl text-balance text-center text-foreground text-section-heading font-medium tracking-tight"
          text={title}
        />
      ) : (
        <Title className="max-w-3xl text-balance text-center text-foreground text-headline">{title}</Title>
      )}

      <div className="max-w-2xl text-center text-muted-foreground text-intro tracking-wide">{children}</div>

      {actions ? (
        <div className="flex w-fit flex-wrap items-center justify-center gap-3 pt-2">{actions}</div>
      ) : null}

      {after ? <div className="flex w-full max-w-3xl justify-center">{after}</div> : null}
    </div>
  );
}
