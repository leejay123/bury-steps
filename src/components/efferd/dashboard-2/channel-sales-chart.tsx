"use client";

import { useId } from "react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
import { formatDate } from "../formater";
import {
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { Delta, DeltaIcon, DeltaValue } from "../delta";
import { DashboardCard } from "./dashboard-card";
import { useDashboardData } from "../dashboard-context";

const VISIBLE_WEEKS = 12;

/** One row per week: first day `date`, `total` / `you` = clock-ins. */
type ChannelSalesChartRow = {
	date: string;
	total: number;
	you: number;
};

function growthPctForWindow(rows: readonly ChannelSalesChartRow[]) {
	const first = rows[0];
	if (!first) {
		return 0;
	}
	const last = rows.at(-1);
	if (!last) {
		return 0;
	}
	const a = first.total;
	const b = last.total;
	if (!a) {
		return 0;
	}
	return ((b - a) / a) * 100;
}

const chartConfig = {
	total: {
		label: "Everyone",
		color: "var(--chart-2)",
	},
	you: {
		label: "You",
		color: "var(--chart-1)",
	},
} satisfies ChartConfig;

export function ChannelSalesChart() {
	const chartUid = useId().replace(/:/g, "");
	const idLineGlow = `channel-sales-line-glow-${chartUid}`;
	const chartRows: ChannelSalesChartRow[] = useDashboardData().weeks.slice(-VISIBLE_WEEKS);
	const growthPctNum = growthPctForWindow(chartRows);

	return (
		<DashboardCard className="gap-0 md:col-span-2">
			<CardHeader>
				<div className="min-w-0 space-y-2">
					<div className="flex flex-wrap items-center gap-2">
						<CardTitle >You and the group</CardTitle>
						<Delta value={growthPctNum} variant="badge">
							<DeltaIcon variant="trend" />
							<DeltaValue />
						</Delta>
					</div>
					<CardDescription>
						Clock-ins per week, last {VISIBLE_WEEKS} weeks.
					</CardDescription>
				</div>
			</CardHeader>
			<CardContent>
				<ChartContainer
					className="aspect-auto h-60 w-full p-0 md:h-80"
					config={chartConfig}
				>
					<LineChart
						accessibilityLayer
						data={chartRows}
						margin={{
							left: 12,
							right: 12,
							top: 8,
						}}
					>
						<CartesianGrid className="stroke-border" vertical={false} />
						<XAxis
							axisLine={false}
							dataKey="date"
							interval="preserveStartEnd"
							minTickGap={24}
							tickFormatter={(value) => formatDate(String(value), "day-month")}
							tickLine={false}
							tickMargin={8}
						/>
						<ChartTooltip
							content={<ChartTooltipContent hideLabel />}
							cursor={false}
						/>
						<defs>
							<filter
								height="140%"
								id={idLineGlow}
								width="140%"
								x="-20%"
								y="-20%"
							>
								<feGaussianBlur result="blur" stdDeviation="10" />
								<feComposite in="SourceGraphic" in2="blur" operator="over" />
							</filter>
						</defs>
						<Line
							dataKey="you"
							dot={false}
							filter={`url(#${idLineGlow})`}
							stroke="var(--color-you)"
							strokeWidth={2}
							type="step"
						/>
						<Line
							dataKey="total"
							dot={false}
							filter={`url(#${idLineGlow})`}
							stroke="var(--color-total)"
							strokeWidth={2}
							type="step"
						/>
					</LineChart>
				</ChartContainer>
			</CardContent>
		</DashboardCard>
	);
}
