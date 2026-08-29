import type { Metadata } from "next";
import { Footprints } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { loadWalkGame } from "@/lib/walk-progress";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { ProgressBoard } from "./progress-board";

export const metadata: Metadata = {
  title: "Progress — Bury Steps Walking Group",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function formatNameList(names: string[]): string {
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export default async function ProgressPage() {
  const user = await requireUser();
  const game = await loadWalkGame(user.id);

  const togetherPct = game.together
    ? Math.min(100, Math.round((game.together.count / game.together.goal) * 100))
    : 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Progress</h1>
        <p className="text-sm text-muted-foreground">
          How we walk together this month — clock-ins, not miles or speed. No winners, no losers.
          Only signed-in members see this.
        </p>
      </div>

      <section className="overflow-hidden rounded-xl border">
        <div className="grid grid-cols-1 sm:grid-cols-3">
          <Stat
            label="This month"
            value={game.viewer.monthCount.toLocaleString("en-GB")}
          />
          <Stat label="This year" value={game.viewer.yearCount.toLocaleString("en-GB")} />
          <Stat
            label={game.viewer.streakWeeks === 1 ? "Week in a row" : "Weeks in a row"}
            value={game.viewer.streakWeeks.toLocaleString("en-GB")}
          />
        </div>
      </section>

      {game.viewer.badges.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">Your badges</h2>
          <div className="flex flex-wrap gap-2">
            {game.viewer.badges.map((badge) => (
              <Badge key={badge.id} variant="secondary">
                {badge.label}
              </Badge>
            ))}
          </div>
        </section>
      ) : null}

      {game.together ? (
        <section className="flex flex-col gap-3 rounded-xl border p-4">
          <h2 className="font-medium">Together</h2>
          <p className="text-sm text-muted-foreground">
            {game.together.count >= game.together.goal
              ? `The group has reached this month’s goal of ${game.together.goal.toLocaleString("en-GB")} clock-ins.`
              : `The group has ${game.together.count.toLocaleString("en-GB")} clock-in${game.together.count === 1 ? "" : "s"} this month, towards ${game.together.goal.toLocaleString("en-GB")}.`}
          </p>
          <div
            aria-valuemax={game.together.goal}
            aria-valuemin={0}
            aria-valuenow={Math.min(game.together.count, game.together.goal)}
            className="h-2 overflow-hidden rounded-full bg-muted"
            role="progressbar"
          >
            <div className="h-full bg-foreground" style={{ width: `${togetherPct}%` }} />
          </div>
        </section>
      ) : null}

      {game.cup ? (
        <section className="flex flex-col gap-1.5 rounded-xl border p-4">
          <h2 className="font-medium">{game.cup.monthLabel} cup</h2>
          <p className="text-sm text-muted-foreground">
            {game.cup.names.length === 1
              ? `This month’s cup is with ${game.cup.names[0]}. It resets next month.`
              : `This month’s cup is shared by ${formatNameList(game.cup.names)}. It resets next month.`}
          </p>
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="font-medium">This month</h2>
          <p className="text-sm text-muted-foreground">
            Everyone who has clocked in to a finished walk this month, grouped by how many. People
            with the same count sit together — a draw, not a place. People with none are not listed.
          </p>
        </div>
        {game.board.length === 0 ? (
          <EmptyState
            description="When a walk is finished, names will show here. Come as you are — there is nothing to catch up."
            icon={Footprints}
            title="No clock-ins this month yet"
          />
        ) : (
          <ProgressBoard board={game.board} />
        )}
      </section>
    </div>
  );
}
