import { ArrowUpRight, MapPin } from "lucide-react";
import { what3wordsUrl } from "@/lib/what3words";
import { cn } from "@/lib/utils";

/**
 * what3words' own slashes are always their brand red regardless of theme —
 * the one fixed spot of colour partner sites use to make an address
 * recognisable at a glance, same as never recolouring a logo.
 */
const WHAT3WORDS_RED = "#E11F26";

export function What3wordsLink({ address, className }: { address: string; className?: string }) {
  return (
    <a
      className={cn(
        "group flex w-full items-center gap-3 rounded-lg border bg-card px-4 py-3 text-sm transition-colors hover:border-foreground/20 hover:bg-accent",
        className,
      )}
      href={what3wordsUrl(address)}
      rel="noopener noreferrer"
      target="_blank"
    >
      <MapPin className="size-5 shrink-0 text-muted-foreground" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-xs text-muted-foreground">Precise location</span>
        <span className="font-mono font-medium">
          <span style={{ color: WHAT3WORDS_RED }}>{"///"}</span>
          {address}
        </span>
        {/* The three words are deliberately random, not a typo or a joke —
            explaining that up front is cheaper than a confused message from
            a member the first time they see one. */}
        <span className="text-xs text-muted-foreground">
          A what3words address — three fixed words that mark this exact spot to within 3 metres.
          Tap to open it in Maps.
        </span>
      </span>
      <ArrowUpRight className="size-4 shrink-0 self-start text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </a>
  );
}
