"use client";

import { useState } from "react";
import { Minus, Plus, Search } from "lucide-react";
import type { FaqCategoryView, FaqView } from "@/lib/faqs";
import { cn } from "@/lib/utils";
import { Answer } from "./faq";

/**
 * The Questions section's other looks (chosen in the page designer), in the
 * same edge-to-edge style as the original: strips and rows that run the full
 * width, lines between them, no floating cards. Each sits under the
 * section's own heading (SectionHead).
 *
 * - search:  a search strip, topic filters sharing one strip, then the questions
 * - grouped: topics down the left; the questions in groups, a heading strip each
 * - cards:   topic filters, then every answer showing in a grid of cells
 */
export type FaqLook = "original" | "search" | "grouped" | "cards";

export function isFaqLook(value: unknown): value is FaqLook {
  return value === "original" || value === "search" || value === "grouped" || value === "cards";
}

type LookProps = {
  topics: FaqCategoryView[];
  faqs: FaqView[];
  facebookUrl: string;
};

const PAD = "px-5 md:px-12";
/** Beside the topic column, as the original's questions are. */
const GROUPED_PAD = "px-5 md:px-12 lg:ps-8";
const ROW_TEXT = "flex-1 text-pretty font-medium text-base leading-snug tracking-tight md:text-lg";
const ANSWER_TEXT = "max-w-3xl whitespace-pre-line text-pretty text-muted-foreground text-sm leading-relaxed md:text-base";
const TOPIC_LABEL = "font-semibold text-muted-foreground text-xs uppercase tracking-wider";

function countIn(faqs: FaqView[], topicId: string) {
  return faqs.filter((faq) => faq.categoryId === topicId).length;
}

/** A question that opens with a + (the original's plus, turning to a minus here). */
function QuestionRow({
  faq,
  open,
  onToggle,
  pad = PAD,
}: {
  faq: FaqView;
  open: boolean;
  onToggle: () => void;
  /** Side padding, shared by the question and its answer. */
  pad?: string;
}) {
  return (
    <div className={cn("border-b", open && "bg-muted/40")}>
      <h3 className="contents">
        <button
          aria-expanded={open}
          className={cn(
            pad,
            "flex w-full items-center gap-4 py-5 text-start hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset md:py-6",
          )}
          onClick={onToggle}
          type="button"
        >
          <span className={cn(ROW_TEXT, open && "font-semibold")}>{faq.question}</span>
          {open ? (
            <Minus aria-hidden className="size-4 shrink-0 text-foreground" />
          ) : (
            <Plus aria-hidden className="size-4 shrink-0 text-muted-foreground" />
          )}
        </button>
      </h3>
      <Answer open={open} padding={pad}>
        <p className={ANSWER_TEXT}>{faq.answer}</p>
      </Answer>
    </div>
  );
}

/** Topic filters sharing one strip ("All" first); scrolls sideways on a phone. */
function TopicStrip({
  topics,
  faqs,
  active,
  onPick,
}: {
  topics: FaqCategoryView[];
  faqs: FaqView[];
  active: string;
  onPick: (id: string) => void;
}) {
  const options = [{ id: "all", label: "All", count: faqs.length }, ...topics.map((t) => ({ id: t.id, label: t.label, count: countIn(faqs, t.id) }))];
  return (
    <div aria-label="Topics" className="flex overflow-x-auto border-b [scrollbar-width:none]" role="group">
      {options.map((option, index) => {
        const on = active === option.id;
        return (
          <button
            aria-pressed={on}
            className={cn(
              "flex h-12 min-w-fit flex-1 items-center justify-center gap-2 whitespace-nowrap px-5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
              index > 0 && "border-l",
              on ? "bg-muted/60 font-semibold text-foreground" : "font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground",
            )}
            key={option.id}
            onClick={() => onPick(option.id)}
            type="button"
          >
            {option.label}
            <span className="font-mono font-normal text-muted-foreground text-xs tabular-nums">{option.count}</span>
          </button>
        );
      })}
    </div>
  );
}

/** "Still stuck?" along the bottom, with the Facebook group's link. */
function StillStuck({ facebookUrl }: { facebookUrl: string }) {
  if (!facebookUrl) return null;
  return (
    <div className={cn(PAD, "flex flex-wrap items-center justify-between gap-3 bg-muted/30 py-4")}>
      <p className="text-muted-foreground text-sm">Still stuck? Ask in the Facebook group.</p>
      <a
        className="inline-flex h-10 items-center rounded-full border bg-background px-4 font-medium text-sm hover:bg-muted"
        href={facebookUrl}
        rel="noopener noreferrer"
        target="_blank"
      >
        Open the Facebook group
      </a>
    </div>
  );
}

/** When the search or topic finds nothing: one row, with a way back. */
function NoMatch({ onClear }: { onClear: () => void }) {
  return (
    <div className={cn(PAD, "flex flex-col items-center gap-3 border-b py-12 text-center")}>
      <p className="font-medium">No matching questions</p>
      <p className="text-muted-foreground text-sm">Try other words, or show every topic.</p>
      <button
        className="inline-flex h-10 items-center rounded-full border bg-background px-4 font-medium text-sm hover:bg-muted"
        onClick={onClear}
        type="button"
      >
        Clear filters
      </button>
    </div>
  );
}

/** A: a search strip, the topic filters, then one list of questions. */
export function FaqSearchLook({ topics, faqs, facebookUrl }: LookProps) {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("all");
  const [open, setOpen] = useState<string | null>(null);
  const words = query.trim().toLowerCase();
  const shown = faqs.filter(
    (faq) =>
      (topic === "all" || faq.categoryId === topic) &&
      (!words || `${faq.question} ${faq.answer}`.toLowerCase().includes(words)),
  );
  return (
    <div className="border-t">
      <label className={cn(PAD, "flex h-14 items-center gap-3 border-b bg-muted/30 focus-within:bg-muted/50")}>
        <Search aria-hidden className="size-4 shrink-0 text-muted-foreground" />
        <span className="sr-only">Search questions</span>
        <input
          className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:appearance-none"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search questions"
          type="search"
          value={query}
        />
      </label>
      <TopicStrip active={topic} faqs={faqs} onPick={setTopic} topics={topics} />
      {shown.length === 0 ? (
        <NoMatch
          onClear={() => {
            setQuery("");
            setTopic("all");
          }}
        />
      ) : (
        shown.map((faq) => (
          <QuestionRow faq={faq} key={faq.id} onToggle={() => setOpen(open === faq.id ? null : faq.id)} open={open === faq.id} />
        ))
      )}
      <StillStuck facebookUrl={facebookUrl} />
    </div>
  );
}

/** B: topics down the left (across the top on phones); the questions grouped by topic. */
export function FaqGroupedLook({ topics, faqs, facebookUrl }: LookProps) {
  const [open, setOpen] = useState<string | null>(null);
  const anchor = (id: string) => `faq-topic-${id.replace(/[^A-Za-z0-9_-]/g, "")}`;
  return (
    <div className="grid border-t lg:grid-cols-4">
      {/* Topic rows run the column's full width, lines right across. */}
      <div className="flex flex-col border-b lg:border-e lg:border-b-0">
        <nav aria-label="Topics" className="flex flex-col">
          {topics.map((topic) => (
            <a
              className={cn(PAD, "flex items-center justify-between gap-3 border-b py-3 font-medium text-sm hover:bg-muted/50 lg:px-8")}
              href={`#${anchor(topic.id)}`}
              key={topic.id}
            >
              {topic.label}
              <span className="font-mono font-normal text-muted-foreground text-xs tabular-nums">{countIn(faqs, topic.id)}</span>
            </a>
          ))}
        </nav>
        {facebookUrl ? (
          <p className={cn(PAD, "py-5 text-muted-foreground text-sm lg:px-8")}>
            Still stuck?{" "}
            <a className="font-medium text-foreground underline underline-offset-4" href={facebookUrl} rel="noopener noreferrer" target="_blank">
              Ask in the Facebook group
            </a>
            .
          </p>
        ) : null}
      </div>
      <div className="min-w-0 lg:col-span-3">
        {topics.map((topic) => (
          <section aria-labelledby={anchor(topic.id)} key={topic.id}>
            <h3
              className={cn(GROUPED_PAD, TOPIC_LABEL, "scroll-mt-(--header-height) border-b bg-muted/30 py-3")}
              id={anchor(topic.id)}
            >
              {topic.label}
            </h3>
            {faqs
              .filter((faq) => faq.categoryId === topic.id)
              .map((faq) => (
                <QuestionRow
                  faq={faq}
                  key={faq.id}
                  onToggle={() => setOpen(open === faq.id ? null : faq.id)}
                  open={open === faq.id}
                  pad={GROUPED_PAD}
                />
              ))}
          </section>
        ))}
      </div>
    </div>
  );
}

/** C: the topic filters, then every answer showing in a grid of cells (no opening). */
export function FaqCardsLook({ topics, faqs, facebookUrl }: LookProps) {
  const [topic, setTopic] = useState("all");
  const shown = faqs.filter((faq) => topic === "all" || faq.categoryId === topic);
  const labelOf = (id: string) => topics.find((t) => t.id === id)?.label ?? "";
  return (
    <div className="border-t">
      <TopicStrip active={topic} faqs={faqs} onPick={setTopic} topics={topics} />
      {/* Lines between the cells: each draws its right and bottom one, and
          the outer right and bottom edges are clipped off, so a short last
          row still has a line above it and no cell is missing one. */}
      <div className="grid border-b">
        <div className="grid [clip-path:inset(0_1px_1px_0)] sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((faq) => (
          <article className={cn(PAD, "flex flex-col gap-2.5 border-r border-b py-7 lg:px-8")} key={faq.id}>
            <span className={TOPIC_LABEL}>{labelOf(faq.categoryId)}</span>
            <h3 className="text-pretty font-semibold text-lg leading-snug tracking-tight">{faq.question}</h3>
            <p className={ANSWER_TEXT}>{faq.answer}</p>
          </article>
        ))}
        </div>
      </div>
      <StillStuck facebookUrl={facebookUrl} />
    </div>
  );
}
