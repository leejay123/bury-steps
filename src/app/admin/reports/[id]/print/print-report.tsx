"use client";

import { useEffect } from "react";
import { SiteLogo } from "@/components/site-logo";
import { Button } from "@/components/ui/button";

export function PrintReport({
  createdBy,
  happenedAt,
  organiserNotes,
  walkLabel,
  whatHappened,
  whatWeDid,
  whoInvolved,
}: {
  createdBy: string;
  happenedAt: string;
  organiserNotes: string | null;
  walkLabel: string | null;
  whatHappened: string;
  whatWeDid: string;
  whoInvolved: string;
}) {
  useEffect(() => {
    let printed = false;
    const run = () => {
      if (printed) return;
      printed = true;
      window.print();
    };

    const logo = new Image();
    logo.onload = run;
    logo.onerror = run;
    logo.src = "/bury-steps-logo.png";
    const fallback = window.setTimeout(run, 800);
    return () => {
      printed = true;
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <div
      className="mx-auto flex max-w-3xl flex-col gap-6 bg-white px-4 py-8 text-black print:max-w-none print:px-0 print:py-0"
      data-print-document=""
    >
      <div className="flex items-start justify-between gap-4 print:hidden">
        <p className="text-sm text-muted-foreground">
          Use the print dialog to save this as a PDF. Turn off Headers and footers so the web
          address is not printed on the page.
        </p>
        <Button onClick={() => window.print()} type="button" variant="outline">
          Print / Save PDF
        </Button>
      </div>

      <header className="flex items-start justify-between gap-4 border-b border-black pb-4">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-xs tracking-[0.18em] uppercase">Bury Steps Walking Group</p>
          <h1 className="text-2xl font-semibold">Accident report</h1>
        </div>
        <SiteLogo className="h-12 w-auto shrink-0 print:h-14" />
      </header>

      <dl className="grid grid-cols-[7.5rem_1fr] gap-x-4 gap-y-1.5 text-sm">
        <dt className="text-neutral-600">When</dt>
        <dd>{happenedAt}</dd>
        <dt className="text-neutral-600">Walk</dt>
        <dd>{walkLabel || "Not linked to a walk"}</dd>
        <dt className="text-neutral-600">Recorded by</dt>
        <dd>{createdBy}</dd>
      </dl>

      <section className="flex flex-col gap-2 break-inside-avoid">
        <h2 className="text-sm font-semibold">What happened</h2>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{whatHappened}</p>
      </section>
      <section className="flex flex-col gap-2 break-inside-avoid">
        <h2 className="text-sm font-semibold">Who was involved</h2>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{whoInvolved}</p>
      </section>
      <section className="flex flex-col gap-2 break-inside-avoid">
        <h2 className="text-sm font-semibold">What we did</h2>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{whatWeDid}</p>
      </section>
      {organiserNotes ? (
        <section className="flex flex-col gap-2 break-inside-avoid">
          <h2 className="text-sm font-semibold">Organiser notes</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{organiserNotes}</p>
        </section>
      ) : null}
    </div>
  );
}
