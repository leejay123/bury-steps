import Link from "next/link";
import { ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { FullWidthDivider } from "@/components/full-width-divider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SettingsBackLink, SettingsSubPageTabs } from "./settings-page-nav";

/** Same width for every settings page, header and body alike, so forms
 * don't stretch edge to edge on a wide screen and every page's left edge
 * lines up with the next. */
const SETTINGS_WIDTH = "mx-auto w-full max-w-4xl";

/**
 * Shared shell for every Settings page, the card-table home included —
 * "← All settings" and the page's group, then the title and a short
 * intro, any sibling tabs (Site wording), then the page's sections.
 */
export function SettingsPage({
  title,
  description,
  children,
  previewHref,
  previewLabel = "View homepage",
  contentClassName,
  showBackLink = true,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  previewHref?: string;
  previewLabel?: string;
  contentClassName?: string;
  /** Off only on the Settings home itself. */
  showBackLink?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <div className="relative px-4 py-6 md:px-6">
        <div className={cn(SETTINGS_WIDTH, "flex flex-col gap-4")}>
          {showBackLink ? <SettingsBackLink /> : null}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
            <div className="flex max-w-2xl flex-col gap-1.5">
              <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
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
          <SettingsSubPageTabs />
        </div>
        <FullWidthDivider position="bottom" />
      </div>
      <div className="px-4 py-6 md:px-6">
        <div className={cn(SETTINGS_WIDTH, "flex flex-col gap-8", contentClassName)}>{children}</div>
      </div>
    </div>
  );
}

/** One bordered block inside a settings page (toggle, form, or list). */
export function SettingsSection({
  children,
  className,
  description,
  /** The content already provides its own bordered box (a DataList) — skip
   * this section's own card border/padding instead of boxing a box, and
   * render the title/description as a plain heading above it like
   * SettingsSectionGroup does. */
  flush = false,
  title,
  tone = "default",
}: {
  children: React.ReactNode;
  className?: string;
  description?: string;
  flush?: boolean;
  title?: string;
  tone?: "default" | "danger";
}) {
  return (
    <section
      className={cn(
        "flex flex-col gap-4",
        flush ? "gap-3" : "rounded-xl border bg-card p-5 md:p-6",
        !flush && tone === "danger" && "border-destructive/40",
        className,
      )}
    >
      {title || description ? (
        <div className="flex flex-col gap-1">
          {title ? (
            <h2
              className={cn(
                flush
                  ? "text-xs font-medium uppercase tracking-wider text-muted-foreground"
                  : "font-medium tracking-tight",
              )}
            >
              {title}
            </h2>
          ) : null}
          {description ? (
            <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

const groupedSectionClassName =
  "[&_section]:rounded-none [&_section]:border-0 [&_section]:bg-card";

/** Cluster related settings under a label, with hairlines between panels. */
export function SettingsSectionGroup({
  children,
  description,
  id,
  title,
}: {
  children: React.ReactNode;
  description?: string;
  id?: string;
  title: string;
}) {
  return (
    <section className="scroll-mt-28 flex flex-col gap-3" id={id}>
      <div className="flex flex-col gap-1">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</h2>
        {description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div
        className={cn(
          "flex flex-col gap-px overflow-hidden rounded-xl border bg-border",
          groupedSectionClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
}

/**
 * An on/off setting: title and explanation on the left, the switch on the
 * right, all in one card — no box nested inside the box. Every toggle in
 * Settings uses this, so they all look and behave the same (including the
 * spinner shown in the switch's place while a change saves).
 */
export function SettingsSwitchSection({
  checked,
  description,
  id,
  onCheckedChange,
  pending,
  title,
}: {
  checked: boolean;
  description: string;
  /** For the switch — also ties the title to it as its label. */
  id: string;
  onCheckedChange: (checked: boolean) => void;
  pending: boolean;
  title: string;
}) {
  return (
    <section className="flex items-start justify-between gap-6 rounded-xl border bg-card p-5 md:p-6">
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="font-medium tracking-tight">
          <label className="cursor-pointer" htmlFor={id}>
            {title}
          </label>
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground" id={`${id}-description`}>
          {description}
        </p>
      </div>
      <div className="flex h-6 w-9 shrink-0 items-center justify-center">
        {pending ? (
          <Loader2 aria-label="Saving" className="size-4 animate-spin text-muted-foreground" role="status" />
        ) : (
          <Switch
            aria-describedby={`${id}-description`}
            checked={checked}
            id={id}
            onCheckedChange={onCheckedChange}
          />
        )}
      </div>
    </section>
  );
}

/**
 * The heading row above a list on a settings page (photos, quotes,
 * questions, notices, categories) — the same small uppercase label the
 * grouped sections use, an optional line of explanation, and the list's
 * main button on the right.
 */
export function SettingsListHeader({
  action,
  description,
  title,
}: {
  action?: React.ReactNode;
  description?: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</h2>
        {description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0 [&>*]:w-full sm:[&>*]:w-auto">{action}</div> : null}
    </div>
  );
}
