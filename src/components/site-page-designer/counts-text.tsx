import { Fragment, type ReactNode } from "react";
import { MapPin } from "lucide-react";
import { CountingNumber } from "@/components/ui/counting-number";

const number = new Intl.NumberFormat("en-GB");

/** The live numbers a designer sentence can use, and the words the designer shows for each. */
export const COUNT_TOKENS = [
  { token: "{upcoming}", label: "Upcoming walks" },
  { token: "{members}", label: "Members" },
  { token: "{walks}", label: "Walks so far" },
  { token: "{places}", label: "Places" },
] as const;

export type Counts = { upcoming: number; members: number; walks: number; places: string[] };

/**
 * A sentence written in the page designer, with the live numbers put in:
 * {upcoming} upcoming walks, {members} members, {walks} walks so far this year
 * and {places} (the walking places, each with a map pin). **Words** stand out
 * in full colour, as the hero's own numbers do. `counting`: the numbers count up as they
 * come into view (the homepage hero's), rather than standing still.
 */
export function CountsText({ text, counts, counting = false }: { text: string; counts: Counts; counting?: boolean }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
          <span className="font-medium text-foreground" key={i}>
            {fill(part.slice(2, -2), counts, counting)}
          </span>
        ) : (
          <Fragment key={i}>{fill(part, counts, counting)}</Fragment>
        ),
      )}
    </>
  );
}

function fill(text: string, counts: Counts, counting: boolean): ReactNode[] {
  const count = (value: number, i: number) =>
    counting ? <CountingNumber grouping key={i} trigger="view" value={value} /> : number.format(value);
  return text.split(/(\{(?:upcoming|members|walks|places)\})/g).map((piece, i) => {
    if (piece === "{upcoming}") return count(counts.upcoming, i);
    if (piece === "{members}") return count(counts.members, i);
    if (piece === "{walks}") return count(counts.walks, i);
    if (piece === "{places}") return <Places key={i} places={counts.places} />;
    return piece;
  });
}

function Places({ places }: { places: string[] }) {
  return (
    <>
      {places.map((place, i) => (
        <Fragment key={place}>
          <span className="whitespace-nowrap font-medium text-foreground">
            <MapPin aria-hidden className="inline-block shrink-0 align-middle me-1 size-[1.05em] -translate-y-[0.1em]" />
            {place}
          </span>
          {i < places.length - 2 ? ", " : i === places.length - 2 ? " and " : ""}
        </Fragment>
      ))}
    </>
  );
}
