import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Splits **only** on a blank line (2+ newlines) into paragraphs — a single
 * newline inside a paragraph becomes a <br>, not a new paragraph, so authors
 * get a tight, predictable gap between paragraphs (set by the parent's own
 * gap-* class) instead of the taller gap raw `white-space: pre-line` gives a
 * blank line (that gap stacks on top of the line's own line-height). Also
 * turns **text** into bold — the only formatting the plain-text description
 * field supports (see the hint under the Textarea in walk-form-fields.tsx). */
export function DescriptionText({ text, className }: { text: string; className?: string }) {
  const paragraphs = text.trim().split(/\n{2,}/);
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {paragraphs.map((paragraph, index) => (
        <p key={index}>{formatParagraph(paragraph)}</p>
      ))}
    </div>
  );
}

function formatParagraph(paragraph: string): ReactNode[] {
  return paragraph.split("\n").flatMap((line, lineIndex, lines) => {
    const nodes: ReactNode[] = boldify(line, lineIndex);
    if (lineIndex < lines.length - 1) nodes.push(<br key={`br-${lineIndex}`} />);
    return nodes;
  });
}

function boldify(line: string, lineIndex: number): ReactNode[] {
  const parts = line.split(/(\*\*[^*]+\*\*)/g).filter((part) => part !== "");
  return parts.map((part, partIndex) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={`${lineIndex}-${partIndex}`}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}
