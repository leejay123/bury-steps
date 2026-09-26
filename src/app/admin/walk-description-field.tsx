"use client";

import { useRef, useState, useTransition } from "react";
import { BoldIcon, ItalicIcon, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { summarizeWalkDescription } from "@/server/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";

/** Wraps (or, if already wrapped, unwraps) the textarea's current selection
 * in `marker` — the same ** and single-* syntax DescriptionText renders as
 * bold/italic. "Already wrapped" is judged by what's immediately outside the
 * selection, not inside it (so selecting just the word inside **word** and
 * clicking Bold again removes those markers instead of adding a second,
 * redundant pair inside them). */
function toggleMarker(value: string, start: number, end: number, marker: string) {
  const before = value.slice(0, start);
  const selected = value.slice(start, end);
  const after = value.slice(end);
  const len = marker.length;

  if (before.endsWith(marker) && after.startsWith(marker)) {
    return {
      value: before.slice(0, -len) + selected + after.slice(len),
      start: start - len,
      end: end - len,
    };
  }
  return {
    value: `${before}${marker}${selected}${marker}${after}`,
    start: start + len,
    end: end + len,
  };
}

/** Description Textarea with a Bold/Italic toolbar (wraps the current
 * selection in bold/italic markers — see DescriptionText, which renders them) and
 * a Summarize button (Google Gemini Flash, via a direct API key — not
 * Vercel AI Gateway — to stay on Google's own free tier). Textarea stays
 * uncontrolled (matches the rest of this form); both the toolbar and the
 * Summarize result write to it through the ref rather than through React
 * state. Summarize shows its result for the organiser to accept or dismiss
 * rather than silently overwriting what they typed. */
export function WalkDescriptionField({
  defaultValue,
  id,
  name = "description",
}: {
  defaultValue: string;
  id: string;
  name?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function applyMarker(marker: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { value, start, end } = toggleMarker(
      textarea.value,
      textarea.selectionStart,
      textarea.selectionEnd,
      marker,
    );
    textarea.value = value;
    textarea.setSelectionRange(start, end);
    textarea.focus();
  }

  function onSummarize() {
    const text = textareaRef.current?.value ?? "";
    startTransition(async () => {
      const result = await summarizeWalkDescription(text);
      if (result.ok) {
        setSummary(result.summary);
      } else {
        toast.error(result.error);
      }
    });
  }

  function useSummary() {
    if (!summary || !textareaRef.current) return;
    textareaRef.current.value = summary;
    setSummary(null);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>Description</Label>
        <Button disabled={isPending} onClick={onSummarize} size="sm" type="button" variant="ghost">
          {isPending ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Sparkles data-icon="inline-start" />}
          {isPending ? "Summarizing…" : "Summarize"}
        </Button>
      </div>
      <div className="flex items-center gap-1">
        <Toggle
          aria-label="Bold selected text"
          disabled={isPending}
          onPressedChange={() => applyMarker("**")}
          pressed={false}
          size="sm"
          variant="outline"
        >
          <BoldIcon />
        </Toggle>
        <Toggle
          aria-label="Italicize selected text"
          disabled={isPending}
          onPressedChange={() => applyMarker("*")}
          pressed={false}
          size="sm"
          variant="outline"
        >
          <ItalicIcon />
        </Toggle>
      </div>
      <Textarea
        defaultValue={defaultValue}
        disabled={isPending}
        id={id}
        name={name}
        placeholder="Roughly 4 miles, one steady climb. Boots recommended after rain."
        ref={textareaRef}
        rows={3}
      />
      <p className="text-xs text-muted-foreground">
        Select text and use the Bold/Italic buttons above. Leave one blank line between paragraphs.
      </p>
      {isPending ? (
        <div className="flex items-center gap-2 rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Summarizing — this can take a few seconds…
        </div>
      ) : null}
      {summary ? (
        <div className="flex flex-col gap-2 rounded-md border bg-muted/40 p-3">
          <p className="text-sm leading-relaxed">{summary}</p>
          <div className="flex gap-2">
            <Button onClick={useSummary} size="sm" type="button">
              Use this
            </Button>
            <Button onClick={() => setSummary(null)} size="sm" type="button" variant="ghost">
              Dismiss
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
