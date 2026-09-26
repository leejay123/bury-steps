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

/** Same **bold** formatting as DescriptionText, but no paragraph splitting —
 * for a line-clamped preview, where the text needs to stay one continuous
 * inline flow for the clamp to count lines correctly. Line breaks (single
 * \n) still become <br>, so a preview reads the same as the full text up to
 * where it gets cut off, just without literal ** markup showing through. */
export function InlineDescriptionText({ text, className }: { text: string; className?: string }) {
  return <span className={className}>{formatParagraph(text)}</span>;
}

function formatParagraph(paragraph: string): ReactNode[] {
  return paragraph.split("\n").flatMap((line, lineIndex, lines) => {
    const nodes: ReactNode[] = boldify(line, lineIndex);
    if (lineIndex < lines.length - 1) nodes.push(<br key={`br-${lineIndex}`} />);
    return nodes;
  });
}

function boldify(line: string, lineIndex: number): ReactNode[] {
  // Bold split first, then italic within whatever's left over — so
  // **bold** never gets mistaken for two *italic* markers by the second
  // pass (it's already been carved out into its own array element by then).
  const parts = line.split(/(\*\*[^*]+\*\*)/g).filter((part) => part !== "");
  return parts.flatMap((part, partIndex): ReactNode[] => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return [<strong key={`${lineIndex}-${partIndex}`}>{part.slice(2, -2)}</strong>];
    }
    return italicize(part, `${lineIndex}-${partIndex}`);
  });
}

function italicize(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(/(\*[^*]+\*)/g).filter((part) => part !== "");
  return parts.map((part, partIndex) => {
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={`${keyPrefix}-${partIndex}`}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}
