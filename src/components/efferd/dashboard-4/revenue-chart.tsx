"use client";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { formatChartAxisTick, formatChartTooltipDate } from "../formater";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Delta, DeltaIcon, DeltaValue } from "../delta";
import { useDashboardData } from "../dashboard-context";
/** Matches `<Select>`; chart uses the last N days of the group’s clock-ins. */
type PeriodDays = 7 | 14 | 30 | 60 | 90;
// Recharts XAxis: `interval` is tick skip index (0 = all, 1 = every other, …).
const xAxisIntervalByPeriod: Record<PeriodDays, number> = {
	7: 0,
	14: 1,
	30: 3,
	60: 4,
	90: 6,
};
type RevenueRow = {
	date: string;
	clockIns: number;
};
const chartConfig = {
	clockIns: {
		label: "Clock-ins",
		color: "var(--chart-1)",
	},
} satisfies ChartConfig;
export function RevenueChart() {
	const chartUid = useId().replace(/:/g, "");
	const idAreaGradient = `revenue-area-grad-${chartUid}`;
	const { days, organiser } = useDashboardData();
	const [periodDays, setPeriodDays] = useState<PeriodDays>(60);
	const chartRows: RevenueRow[] = useMemo(() => days.slice(-periodDays), [days, periodDays]);
	// Footer delta: the later half of the window against the earlier half.
	const growthPct = useMemo(() => {
		const half = Math.floor(chartRows.length / 2);
		const first = chartRows.slice(0, half).reduce((sum, row) => sum + row.clockIns, 0);
		const last = chartRows.slice(half).reduce((sum, row) => sum + row.clockIns, 0);
		if (!first) {
			return 0;
		}
		return ((last - first) / first) * 100;
	}, [chartRows]);
	// Extra spacing so long ranges don’t collide; pairs with `interval` above.
	let xAxisMinTickGap: number | undefined;
	if (periodDays <= 7) {
		xAxisMinTickGap = undefined;
	} else {
		xAxisMinTickGap = Math.max(8, Math.min(52, Math.floor(periodDays / 2)));
	}
	return (
		<Card className="md:col-span-2 lg:col-span-4">
			<CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<CardTitle className="text-balance">Clock-ins</CardTitle>
				<Select
					onValueChange={(v) => {
						setPeriodDays(Number(v) as PeriodDays);
					}}
					value={String(periodDays)}
				>
					<SelectTrigger
						aria-label="Clock-ins time range"
						className="w-full min-w-36 sm:w-fit"
						size="sm"
					>
						<SelectValue placeholder="Range" />
					</SelectTrigger>
					<SelectContent align="end">
						<SelectItem value="7">Last 7 days</SelectItem>
						<SelectItem value="14">Last 14 days</SelectItem>
						<SelectItem value="30">Last 30 days</SelectItem>
						<SelectItem value="60">Last 60 days</SelectItem>
						<SelectItem value="90">Last 90 days</SelectItem>
					</SelectContent>
				</Select>
			</CardHeader>
			<CardContent>
				<ChartContainer
					className="aspect-auto h-60 w-full p-0"
					config={chartConfig}
				>
					<AreaChart
						accessibilityLayer
						// Copy so Recharts always sees a mutable array reference.
						data={[...chartRows]}
						margin={{ left: 24, right: 8, top: 8, bottom: 0 }}
					>
						<defs>
							<linearGradient id={idAreaGradient} x1="0" x2="0" y1="0" y2="1">
								<stop
									offset="0%"
									stopColor="var(--color-clockIns)"
									stopOpacity={0.2}
								/>
								<stop
									offset="100%"
									stopColor="var(--color-clockIns)"
									stopOpacity={0}
								/>
							</linearGradient>
						</defs>
						<CartesianGrid horizontal={false} strokeDasharray="2 2" />
						<XAxis
							axisLine={false}
							dataKey="date"
							interval={xAxisIntervalByPeriod[periodDays]}
							minTickGap={xAxisMinTickGap}
							tickFormatter={(value) =>
								formatChartAxisTick(String(value), periodDays)
							}
							tickLine={false}
							tickMargin={8}
						/>
						<ChartTooltip
							content={
								<ChartTooltipContent
									className="min-w-36"
									indicator="line"
									labelFormatter={(_, payload) => {
										const row = payload?.[0]?.payload as RevenueRow | undefined;
										if (!row?.date) {
											return "";
										}
										return formatChartTooltipDate(row.date, "short");
									}}
								/>
							}
						/>
						<Area
							dataKey="clockIns"
							dot={false}
							fill={`url(#${idAreaGradient})`}
							stroke="var(--color-clockIns)"
							strokeWidth={2}
							type="monotone"
						/>
					</AreaChart>
				</ChartContainer>
			</CardContent>
			<CardFooter className="flex items-center justify-between">
				<div className="flex items-center gap-1 text-muted-foreground text-xs">
					<Delta value={growthPct}>
						<DeltaIcon />
						<DeltaValue />
					</Delta>
					<p className="inline-flex text-pretty">
						second half against first half of the last {periodDays} days.
					</p>
				</div>
				<Button
					asChild
					className="text-muted-foreground"
					size="xs"
					variant="ghost"
				>
					<Link href={organiser ? "/admin/reports" : "/progress"}>
						{organiser ? "View reports" : "Group progress"}
						<ArrowRightIcon
							aria-hidden="true"
							data-icon="inline-end"
						/>
					</Link>
				</Button>
			</CardFooter>
		</Card>
	);
}
