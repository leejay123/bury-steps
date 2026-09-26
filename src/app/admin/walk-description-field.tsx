"use client";

import { useRef, useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { summarizeWalkDescription } from "@/server/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/** Description Textarea plus a Summarize button (Google Gemini Flash, via a
 * direct API key — not Vercel AI Gateway — to stay on Google's own free
 * tier). Textarea stays uncontrolled (matches the rest of this form); the
 * button reads its live value through the ref and, on success, shows the
 * summary for the organiser to accept or dismiss rather than silently
 * overwriting what they typed. */
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
          <Sparkles className={isPending ? "animate-pulse" : undefined} data-icon="inline-start" />
          {isPending ? "Summarizing…" : "Summarize"}
        </Button>
      </div>
      <Textarea
        defaultValue={defaultValue}
        id={id}
        name={name}
        placeholder="Roughly 4 miles, one steady climb. Boots recommended after rain."
        ref={textareaRef}
        rows={3}
      />
      <p className="text-xs text-muted-foreground">
        Wrap words in **double asterisks** for bold. Leave one blank line between paragraphs.
      </p>
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
