"use client";

import { useEffect } from "react";
import { SiteLogo } from "@/components/site-logo";
import { Button } from "@/components/ui/button";

export function PrintReport({
  createdBy,
  happenedAt,
  logoSrc,
  organiserNotes,
  reportNumber,
  walkLocation,
  walkTitle,
  whatHappened,
  whatWeDid,
  whoInvolved,
}: {
  createdBy: string;
  happenedAt: string;
  logoSrc: string;
  organiserNotes: string | null;
  reportNumber: string | null;
  walkLocation: string | null;
  walkTitle: string | null;
  whatHappened: string;
  whatWeDid: string;
  whoInvolved: string;
}) {
  // Print once the logo has loaded (or failed), so it isn't missing from the page; a
  // short fallback in case it never reports back.
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
    logo.src = logoSrc;

    const fallback = window.setTimeout(run, 800);
    return () => {
      printed = true;
      window.clearTimeout(fallback);
    };
  }, [logoSrc]);

  const sections: [string, string | null][] = [
    ["What happened", whatHappened],
    ["Who was involved", whoInvolved],
    ["What we did", whatWeDid],
    ["Organiser notes", organiserNotes],
  ];

  // Print A (the ruled form): one black frame, the title beside the logo, the details as three
  // cells, then a row per part of the write-up with its name in a grey column on the left.
  return (
    <div
      className="flex flex-col gap-6 bg-white px-4 py-8 text-black [print-color-adjust:exact] md:px-6 print:px-0 print:py-0"
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

      <div className="mx-auto flex w-full max-w-[794px] flex-col border border-black">
        {/*
          A plain div, not a <header> — the sitewide print CSS hides every
          `header`/`footer` tag on the page to drop the site's own nav when
          printing, and that was silently taking this block (the report's
          own logo + title) out along with it.
        */}
        <div className="flex items-stretch border-b border-black">
          <div className="flex min-w-0 flex-1 flex-col gap-1 px-6 py-5">
            <p className="text-xs tracking-[0.16em] uppercase">Bury Steps Walking Group</p>
            <h1 className="text-[2rem] leading-tight font-bold">
              Accident report{reportNumber ? ` ${reportNumber}` : ""}
            </h1>
          </div>
          <div className="flex w-[150px] shrink-0 items-center justify-center border-l border-black p-3">
            <SiteLogo className="h-14 w-auto" sizes="160px" src={logoSrc} />
          </div>
        </div>

        <div className="grid grid-cols-3 border-b border-black">
          <div className="flex flex-col gap-1 border-r border-black px-4 py-3">
            <span className="text-xs text-neutral-600">When</span>
            <span className="text-[0.9375rem] font-semibold">{happenedAt}</span>
          </div>
          <div className="flex flex-col gap-1 border-r border-black px-4 py-3">
            <span className="text-xs text-neutral-600">Walk</span>
            <span className="text-[0.9375rem] font-semibold">{walkTitle || "Not linked to a walk"}</span>
            {walkLocation ? <span className="text-xs text-neutral-600">{walkLocation}</span> : null}
          </div>
          <div className="flex flex-col gap-1 px-4 py-3">
            <span className="text-xs text-neutral-600">Recorded by</span>
            <span className="text-[0.9375rem] font-semibold">{createdBy}</span>
          </div>
        </div>

        {sections
          .filter(([, text]) => text)
          .map(([title, text], index, shown) => (
            <section
              className={`grid grid-cols-[150px_minmax(0,1fr)] break-inside-avoid${index < shown.length - 1 ? " border-b border-black" : ""}`}
              key={title}
            >
              <h2 className="border-r border-black bg-neutral-100 px-4 py-3.5 text-[0.8125rem] font-bold">{title}</h2>
              <p className="px-4 py-3.5 text-[0.9375rem] leading-relaxed whitespace-pre-wrap">{text}</p>
            </section>
          ))}
      </div>
    </div>
  );
}
