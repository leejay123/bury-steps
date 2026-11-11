"use client";

import { AutoField, FieldLabel } from "@puckeditor/core";
import { COUNT_TOKENS } from "./counts-text";

/**
 * A designer text box that can use the live numbers: buttons under it add
 * {upcoming}, {members}, {walks} or {places}, which the page fills in. Left
 * empty, the block keeps its usual words (shown greyed as a hint).
 */
export const countsField = (label: string, usual: string, multiline = true) => ({
  type: "custom" as const,
  label,
  render: ({ value, onChange, id }: { value?: string; onChange: (value: string) => void; id: string }) => (
    <CountsField id={id} label={label} multiline={multiline} onChange={onChange} usual={usual} value={value ?? ""} />
  ),
});

function CountsField({
  id,
  label,
  multiline,
  onChange,
  usual,
  value,
}: {
  id: string;
  label: string;
  multiline: boolean;
  onChange: (value: string) => void;
  usual: string;
  value: string;
}) {
  const add = (token: string) => {
    const start = value.trim() ? value : usual;
    onChange(`${start}${/\s$/.test(start) || !start ? "" : " "}${token}`);
  };
  return (
    <FieldLabel el="div" label={label}>
      <div className="flex flex-col gap-2">
        <AutoField
          field={{ type: multiline ? "textarea" : "text", placeholder: usual } as never}
          id={id}
          onChange={(next: string) => onChange(next)}
          value={value}
        />
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-muted-foreground">Add a live number:</span>
          {COUNT_TOKENS.map(({ token, label: name }) => (
            <button
              className="rounded-md border px-2 py-0.5 font-medium hover:bg-muted"
              key={token}
              onClick={() => add(token)}
              type="button"
            >
              {name}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Empty keeps the usual words. Put **stars** round words to make them stand out.
        </p>
      </div>
    </FieldLabel>
  );
}
