import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { SettingsBackLink } from "./settings-back-link";
import { FullWidthDivider } from "@/components/full-width-divider";
import { Button } from "@/components/ui/button";

/**
 * Shared shell for every Settings → … page so each one matches the hub:
 * breadcrumb, clear title, short intro, then structured content panels.
 */
export function SettingsPage({
  title,
  description,
  children,
  previewHref,
  previewLabel = "View homepage",
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  previewHref?: string;
  previewLabel?: string;
}) {
  return (
    <div className="flex flex-col">
      <div className="relative flex flex-col gap-4 px-4 py-6 md:px-6">
        <SettingsBackLink page={title} />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div className="flex max-w-2xl flex-col gap-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
          </div>
          {previewHref ? (
            <Button asChild className="shrink-0 self-start sm:self-auto" size="sm" variant="outline">
              <Link href={previewHref} rel="noopener noreferrer" target="_blank">
                {previewLabel}
                <ExternalLink aria-hidden className="size-3.5" />
              </Link>
            </Button>
          ) : null}
        </div>
        <FullWidthDivider position="bottom" />
      </div>
      <div className="flex flex-col gap-6 px-4 py-6 md:px-6">{children}</div>
    </div>
  );
}

/** One bordered block inside a settings page (toggle, form, or list). */
export function SettingsSection({
  children,
  className,
  description,
  title,
  tone = "default",
}: {
  children: React.ReactNode;
  className?: string;
  description?: string;
  title?: string;
  tone?: "default" | "danger";
}) {
  return (
    <section
      className={cn(
        "flex flex-col gap-4 rounded-xl border bg-card p-5 md:p-6",
        tone === "danger" && "border-destructive/40",
        className,
      )}
    >
      {title || description ? (
        <div className="flex flex-col gap-1">
          {title ? <h2 className="font-medium tracking-tight">{title}</h2> : null}
          {description ? (
            <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
