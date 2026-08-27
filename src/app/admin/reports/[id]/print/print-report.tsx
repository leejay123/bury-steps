"use client";

import { useEffect } from "react";
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
    const timer = window.setTimeout(() => window.print(), 300);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 bg-white px-4 py-8 text-black print:max-w-none print:px-0 print:py-0">
      <div className="flex items-start justify-between gap-4 print:hidden">
        <p className="text-sm text-muted-foreground">
          Use the print dialog to save this as a PDF.
        </p>
        <Button onClick={() => window.print()} type="button" variant="outline">
          Print / Save PDF
        </Button>
      </div>

      <header className="flex flex-col gap-1 border-b pb-4">
        <p className="text-xs tracking-[0.18em] uppercase">Bury Steps Walking Group</p>
        <h1 className="text-2xl font-semibold">Accident report</h1>
        <p className="text-sm">{happenedAt}</p>
        {walkLabel ? <p className="text-sm">Walk: {walkLabel}</p> : null}
        <p className="text-sm">Recorded by {createdBy}</p>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">What happened</h2>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{whatHappened}</p>
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">Who was involved</h2>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{whoInvolved}</p>
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">What we did</h2>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{whatWeDid}</p>
      </section>
      {organiserNotes ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold">Organiser notes</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{organiserNotes}</p>
        </section>
      ) : null}
    </div>
  );
}
