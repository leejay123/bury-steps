import Link from "next/link";
import { Bell, CalendarPlus, Footprints, History, BarChart3 } from "lucide-react";
import { formatTime, formatWalkDay } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OverviewChart } from "./overview-chart";
import type { OverviewData, OverviewItem, OverviewStat } from "./overview-data";

/** A panel: a cell in the bordered grids (1, 2), a card in the card grids (3, 4). */
function Panel({
  cards,
  className,
  title,
  children,
}: {
  cards: boolean;
  className?: string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex min-w-0 flex-col gap-3 bg-background p-4 md:p-5",
        cards && "rounded-xl border shadow-xs",
        className,
      )}
    >
      {title ? <h2 className="text-sm font-medium">{title}</h2> : null}
      {children}
    </section>
  );
}

function Stat({ stat, cards }: { stat: OverviewStat; cards: boolean }) {
  return (
    <Panel cards={cards}>
      <p className="text-xs tracking-wide text-muted-foreground">{stat.label}</p>
      <p className="text-2xl font-medium tabular-nums">{stat.value}</p>
      {stat.note ? <p className="truncate text-xs text-muted-foreground">{stat.note}</p> : null}
    </Panel>
  );
}

function WalksTable({ data }: { data: OverviewData }) {
  if (data.walks.length === 0)
    return <p className="text-sm text-muted-foreground">No walks coming up yet.</p>;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Walk</TableHead>
          <TableHead>When</TableHead>
          <TableHead className="max-md:hidden">Leader</TableHead>
          {data.organiser ? <TableHead className="text-right">Clocked in</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.walks.map((walk) => (
          <TableRow key={walk.id}>
            <TableCell className="max-w-56 truncate font-medium">
              <Link className="hover:underline" href={walk.href}>
                {walk.title}
              </Link>
            </TableCell>
            <TableCell className="whitespace-nowrap text-muted-foreground">
              {formatWalkDay(walk.startsAt)} · {formatTime(walk.startsAt)}
            </TableCell>
            <TableCell className="text-muted-foreground max-md:hidden">{walk.leader ?? "—"}</TableCell>
            {data.organiser ? <TableCell className="text-right tabular-nums">{walk.clockedIn}</TableCell> : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ItemList({ items, empty }: { items: OverviewItem[]; empty: string }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="flex flex-col divide-y">
      {items.map((item) => {
        const body = (
          <>
            <span className="flex items-baseline justify-between gap-3">
              <span className="truncate text-sm font-medium">{item.title}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{item.at}</span>
            </span>
            <span className="line-clamp-1 text-xs text-muted-foreground">{item.detail}</span>
          </>
        );
        return (
          <li className="py-2 first:pt-0 last:pb-0" key={item.id}>
            {item.href ? (
              <Link className="flex flex-col gap-0.5 hover:opacity-80" href={item.href}>
                {body}
              </Link>
            ) : (
              <span className="flex flex-col gap-0.5">{body}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function QuickActions({ data }: { data: OverviewData }) {
  const actions = [
    ...(data.organiser ? [{ href: "/admin/walks", label: "Create or manage walks", Icon: CalendarPlus }] : []),
    { href: data.organiser ? "/admin/walks" : "/walks", label: "See all walks", Icon: Footprints },
    { href: "/notices", label: "Read notices", Icon: Bell },
    { href: "/progress", label: "Group progress", Icon: BarChart3 },
    { href: "/history", label: "Your walk history", Icon: History },
  ];
  return (
    <ul className="flex flex-col gap-1">
      {actions.map(({ href, label, Icon }) => (
        <li key={label}>
          <Link className="flex items-center gap-2.5 rounded-md px-2 py-2 text-sm hover:bg-muted" href={href}>
            <Icon aria-hidden className="size-4 text-muted-foreground" />
            {label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * The dashboard's Overview in one of four layouts after Efferd's dashboards:
 * 1 a welcome over a bordered three-column grid; 2 a dense bordered grid;
 * 3 a grid of cards with two charts; 4 cards with quick actions.
 */
export function Overview({ data, design }: { data: OverviewData; design: string }) {
  const welcome = (
    <div className="flex flex-col gap-1">
      <h1 className="text-xl font-semibold leading-tight">Welcome back, {data.firstName}!</h1>
      <p className="text-muted-foreground">
        {data.organiser ? "Here's how the group is doing." : "Here's your walking at a glance."}
      </p>
    </div>
  );
  const side = (cards: boolean, className?: string) => (
    <Panel cards={cards} className={className} title={data.sideTitle}>
      <ItemList empty="Nothing yet." items={data.side} />
    </Panel>
  );

  if (design === "2")
    return (
      <div className="flex flex-col gap-6">
        {welcome}
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border bg-border md:grid-cols-2 lg:grid-cols-4">
          {data.stats.map((stat) => (
            <Stat cards={false} key={stat.label} stat={stat} />
          ))}
          <Panel cards={false} className="md:col-span-2" title={data.chartTitle}>
            <OverviewChart data={data.chart} kind="bar" />
          </Panel>
          <Panel cards={false} className="md:col-span-2" title="Latest notices">
            <ItemList empty="No notices yet." items={data.notices} />
          </Panel>
          <Panel cards={false} className="md:col-span-2 lg:col-span-3" title="Upcoming walks">
            <WalksTable data={data} />
          </Panel>
          {side(false)}
        </div>
      </div>
    );
  if (design === "3")
    return (
      <div className="flex flex-col gap-6">
        {welcome}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.stats.map((stat) => (
            <Stat cards key={stat.label} stat={stat} />
          ))}
          <Panel cards className="sm:col-span-2" title={data.chartTitle}>
            <OverviewChart data={data.chart} kind="bar" />
          </Panel>
          <Panel cards className="sm:col-span-2" title={data.chartTitle}>
            <OverviewChart data={data.chart} kind="area" />
          </Panel>
          <Panel cards className="sm:col-span-2 lg:col-span-3" title="Upcoming walks">
            <WalksTable data={data} />
          </Panel>
          {side(true)}
        </div>
      </div>
    );
  if (design === "4")
    return (
      <div className="flex flex-col gap-6">
        {welcome}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {data.stats.map((stat) => (
            <Stat cards key={stat.label} stat={stat} />
          ))}
          <Panel cards className="md:col-span-2 lg:col-span-3" title={data.chartTitle}>
            <OverviewChart data={data.chart} kind="area" />
          </Panel>
          <Panel cards title="Quick actions">
            <QuickActions data={data} />
          </Panel>
          <Panel cards className="md:col-span-2" title="Upcoming walks">
            <WalksTable data={data} />
          </Panel>
          {side(true, "md:col-span-2")}
        </div>
      </div>
    );
  // Design 1.
  return (
    <div className="flex flex-col gap-6">
      {welcome}
      <div className="overflow-hidden rounded-lg border">
        <div className="grid grid-cols-1 gap-px bg-border lg:grid-cols-3">
          {data.stats.slice(0, 3).map((stat) => (
            <Stat cards={false} key={stat.label} stat={stat} />
          ))}
          <Panel cards={false} className="lg:col-span-2" title={data.chartTitle}>
            <OverviewChart data={data.chart} kind="area" />
          </Panel>
          {side(false)}
          <Panel cards={false} className="lg:col-span-3" title="Upcoming walks">
            <WalksTable data={data} />
          </Panel>
        </div>
      </div>
    </div>
  );
}
