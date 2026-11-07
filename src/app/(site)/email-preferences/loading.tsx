import { PageTop } from "@/components/page-top";
import { EMAIL_PREFERENCE_OPTIONS } from "@/lib/email-preferences";

/** A grey shape the size of what loads in its place (a span, so it can sit in the intro's <p>). */
function Shape({ className }: { className: string }) {
  return <span aria-hidden className={`inline-block animate-pulse rounded-md bg-accent align-middle ${className}`} />;
}

/**
 * While it loads (a refresh): the same list as MyEmailPreferencesForm, labels
 * and all, with grey shapes for the ticks, the switch and the email address,
 * so the page swaps in on top instead of the list popping into an empty
 * space. Accident reports is an organisers' row: shown from
 * html[data-sb-role], set before the first paint (shadcnio.css).
 */
export default function Loading() {
  return (
    <div aria-busy="true" className="flex flex-col gap-6" data-page-loading="">
      <PageTop className="space-y-1" eyebrow="Settings" intro={<Shape className="h-4 w-56" />} title="Email preferences" />
      <div className="flex flex-col gap-5">
        <div className="flex flex-col divide-y rounded-xl border" data-edge-list="" data-edge-top="">
          <p className="bg-muted/50 px-4 py-2.5 text-base font-medium">Email</p>
          {EMAIL_PREFERENCE_OPTIONS.map((option) => (
            <div
              className={
                option.adminOnly
                  ? "hidden items-start gap-3 px-4 py-3.5 [html[data-sb-role=organiser]_&]:flex [html[data-sb-role=owner]_&]:flex"
                  : "flex items-start gap-3 px-4 py-3.5"
              }
              key={option.name}
            >
              <Shape className="mt-0.5 size-4 shrink-0 rounded-lg" />
              <span className="flex flex-col items-start gap-0.5">
                <span className="text-sm font-medium">{option.label}</span>
                <span className="text-sm text-muted-foreground">{option.hint}</span>
              </span>
            </div>
          ))}
          <p className="bg-muted/50 px-4 py-2.5 text-base font-medium">Phone</p>
          <div className="flex items-start justify-between gap-4 px-4 py-3.5">
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">Walk starting soon</span>
              <span className="text-sm text-muted-foreground">
                A notification about an hour before a walk. On an iPhone, add the site to your Home
                Screen first. On Android or a computer, allow notifications in the browser.
              </span>
            </span>
            <Shape className="mt-0.5 h-[1.15rem] w-8 shrink-0 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
