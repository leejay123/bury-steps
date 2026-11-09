import { ArrowRight, Heart, House, Sparkles, UsersRound, type LucideIcon } from "lucide-react";
import { IntentLink as Link } from "@/components/intent-link";
import { SectionTitle } from "@/components/section-title";
import { cn } from "@/lib/utils";
import { PillLink } from "./parts";

/**
 * How this started's other looks (chosen in the page designer), edge to edge
 * like the rest of the homepage.
 *
 * - split: the heading and its words on the left, the story on the right
 * - words: the story centred, its words in a strip of cells under it
 */
export type AboutLook = "original" | "split" | "words";

export function isAboutLook(value: unknown): value is AboutLook {
  return value === "original" || value === "split" || value === "words";
}

/** "Kindness · Friendship · Welcome" → the three words. */
export function splitWords(raw: string): string[] {
  return raw
    .split(/[·•|,]/)
    .map((word) => word.trim())
    .filter(Boolean)
    .slice(0, 3);
}

/** An icon for each of the usual words; a plain sparkle for any other. */
function wordIcon(word: string): LucideIcon {
  const key = word.toLowerCase();
  if (key.includes("kind")) return Heart;
  if (key.includes("friend")) return UsersRound;
  if (key.includes("welcom")) return House;
  return Sparkles;
}

type AboutProps = {
  id: string;
  title: string;
  /** Its first sentence (in full colour), and the rest. */
  lead: string;
  rest: string;
  words: string[];
  readMore: boolean;
};

/** A: the heading and its words on the left, the story beside them, Read the full story along the bottom. */
export function AboutSplitLook({ id, title, lead, rest, words, readMore }: AboutProps) {
  return (
    <div className="grid lg:grid-cols-[26rem_minmax(0,1fr)]">
      {/* On a phone the words' last row sits on the column's own bottom line (no doubled line). */}
      <div
        className={cn(
          "flex flex-col justify-between gap-8 border-b px-5 pt-12 md:px-12 lg:border-e lg:border-b-0 lg:py-16",
          words.length === 0 && "pb-12",
        )}
      >
        <SectionTitle className="text-balance font-semibold text-3xl tracking-tighter md:text-4xl" id={id} text={title} />
        {words.length > 0 ? (
          <ul className="flex flex-col border-t max-lg:[&>li:last-child]:border-b-0">
            {words.map((word) => (
              <li className="border-b py-3 font-medium text-sm" key={word}>
                {word}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-col">
        <div className="flex flex-1 flex-col justify-center gap-5 px-5 py-12 md:px-12 lg:py-16">
          <p className="text-pretty font-medium text-xl leading-snug tracking-tight md:text-2xl">{lead}</p>
          {rest ? <p className="max-w-2xl text-pretty text-muted-foreground md:text-lg">{rest}</p> : null}
        </div>
        {readMore ? (
          <Link
            // A white strip, as every Read more's (grey only on hover).
            className="flex items-center justify-between gap-3 border-t bg-background px-5 py-5 font-medium text-sm hover:bg-muted/50 md:px-12"
            href="/about"
          >
            Read the full story
            <ArrowRight aria-hidden className="size-4 rtl:rotate-180" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}

/** B: the story centred, then its words in a strip of cells, each with an icon. */
export function AboutWordsLook({ id, title, lead, rest, words, readMore }: AboutProps) {
  return (
    <>
      <div className="flex flex-col items-center gap-5 px-5 py-12 text-center md:px-12 md:py-16">
        <div className="mx-auto flex max-w-2xl min-w-0 flex-col items-center gap-3 lg:gap-4">
          <SectionTitle className="text-balance font-semibold text-3xl tracking-tighter md:text-4xl" id={id} text={title} />
          <p className="text-pretty text-muted-foreground md:text-lg">
            <span className="font-medium text-foreground">{lead}</span> {rest}
          </p>
        </div>
        {readMore ? (
          <PillLink arrow href="/about">
            Read more
          </PillLink>
        ) : null}
      </div>
      {words.length > 0 ? (
        <ul
          className={cn(
            "grid border-t",
            words.length === 2 && "sm:grid-cols-2",
            words.length === 3 && "sm:grid-cols-3",
          )}
        >
          {words.map((word, i) => {
            const Icon = wordIcon(word);
            return (
              <li
                className={cn(
                  "flex flex-col items-center gap-2.5 px-5 py-8",
                  // One line between cells: down the side on a computer, across on a phone.
                  i > 0 && "max-sm:border-t sm:border-l",
                )}
                key={word}
              >
                <Icon aria-hidden className="size-5 text-muted-foreground" />
                <span className="font-semibold">{word}</span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </>
  );
}
