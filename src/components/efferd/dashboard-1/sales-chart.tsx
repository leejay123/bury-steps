"use client";

import { useId, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { formatDate } from "../formater";
import {
	Card,
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Delta, DeltaIcon, DeltaValue } from "../delta";
import { useDashboardData } from "../dashboard-context";

type PeriodWeeks = 8 | 26;

/** One row per week: first day `date`, `others` / `you` = clock-ins. */
type SalesChartRow = {
	date: string;
	others: number;
	you: number;
};

function rowTotal(row: SalesChartRow) {
	return row.others + row.you;
}

const chartConfig = {
	others: {
		label: "Everyone else",
		color: "var(--chart-2)",
	},
	you: {
		label: "You",
		color: "var(--chart-3)",
	},
} satisfies ChartConfig;

const animationConfig = {
	glowWidth: 520,
};

function highlightXFromChartMouseEvent(e: unknown): number | null {
	const ex = e as {
		activeCoordinate?: { x?: number; y?: number };
		chartX?: number;
	};
	const fromActive = ex.activeCoordinate?.x;
	if (typeof fromActive === "number" && Number.isFinite(fromActive)) {
		return fromActive;
	}
	const legacy = ex.chartX;
	if (typeof legacy === "number" && Number.isFinite(legacy)) {
		return legacy;
	}
	return null;
}

export function SalesChart() {
	const chartUid = useId().replace(/:/g, "");
	const idMaskGrad = `sales-chart-mask-grad-${chartUid}`;
	const idMask = `sales-chart-highlight-mask-${chartUid}`;

	const chartData: SalesChartRow[] = useDashboardData().weeks;
	const [periodDays, setPeriodDays] = useState<PeriodWeeks>(8);
	const [xAxis, setXAxis] = useState<number | null>(null);

	const chartRows = useMemo(() => chartData.slice(-periodDays), [chartData, periodDays]);

	const growthPctNum = useMemo(() => {
		const first = chartRows[0];
		if (!first) {
			return 0;
		}
		const last = chartRows.at(-1);
		if (!last) {
			return 0;
		}
		const a = rowTotal(first);
		const b = rowTotal(last);
		if (!a) {
			return 0;
		}
		return ((b - a) / a) * 100;
	}, [chartRows]);

	const xAxisMinTickGap: number | undefined = periodDays > 8 ? 32 : undefined;

	const idGradYou = `sales-chart-grad-online-${chartUid}`;
	const idGradOthers = `sales-chart-grad-retail-${chartUid}`;

	return (
		<Card className="rounded-none border-0 bg-background py-4 shadow-none ring-0 lg:col-span-3">
			<CardHeader>
				<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
					<div className="min-w-0 space-y-2">
						<div className="flex flex-wrap items-center gap-2">
							<CardTitle className="text-base">Clock-ins</CardTitle>
							<Delta value={growthPctNum} variant="badge">
								<DeltaIcon variant="trend" />
								<DeltaValue />
							</Delta>
						</div>
						<CardDescription>
							Clock-ins per week, yours and everyone else’s, last {periodDays} weeks.
						</CardDescription>
					</div>
					<Select
						onValueChange={(v) => {
							const n = Number(v);
							if (n === 8 || n === 26) {
								setPeriodDays(n);
							}
						}}
						value={String(periodDays)}
					>
						<SelectTrigger
							aria-label="Clock-ins chart time range"
							className="w-full min-w-36 sm:w-fit"
							size="sm"
						>
							<SelectValue placeholder="Range" />
						</SelectTrigger>
						<SelectContent align="end">
							<SelectItem value="8">Last 8 weeks</SelectItem>
							<SelectItem value="26">Last 26 weeks</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</CardHeader>
			<CardContent>
				<ChartContainer
					className="aspect-21/9 min-h-48 w-full p-0"
					config={chartConfig}
				>
					<AreaChart
						// accessibilityLayer
						data={chartRows}
						margin={{
							left: 4,
							right: 12,
							top: 8,
						}}
						onMouseLeave={() => setXAxis(null)}
						onMouseMove={(e) => setXAxis(highlightXFromChartMouseEvent(e))}
					>
						<CartesianGrid
							className="stroke-border"
							strokeDasharray="3 3"
							vertical={false}
						/>
						<XAxis
							axisLine={false}
							dataKey="date"
							interval={periodDays <= 8 ? 0 : "preserveStartEnd"}
							minTickGap={xAxisMinTickGap}
							tickFormatter={(value) => formatDate(String(value), "day-month")}
							tickLine={false}
							tickMargin={8}
						/>
						<ChartTooltip content={<ChartTooltipContent />} cursor={false} />

						<defs>
							<linearGradient id={idMaskGrad} x1="0" x2="1" y1="0" y2="0">
								<stop offset="0%" stopColor="transparent" />
								<stop offset="28%" stopColor="white" stopOpacity={0.55} />
								<stop offset="50%" stopColor="white" />
								<stop offset="72%" stopColor="white" stopOpacity={0.55} />
								<stop offset="100%" stopColor="transparent" />
							</linearGradient>
							<linearGradient id={idGradYou} x1="0" x2="0" y1="0" y2="1">
								<stop
									offset="5%"
									stopColor="var(--color-you)"
									stopOpacity={0.4}
								/>
								<stop
									offset="95%"
									stopColor="var(--color-you)"
									stopOpacity={0}
								/>
							</linearGradient>
							<linearGradient id={idGradOthers} x1="0" x2="0" y1="0" y2="1">
								<stop
									offset="5%"
									stopColor="var(--color-others)"
									stopOpacity={0.4}
								/>
								<stop
									offset="95%"
									stopColor="var(--color-others)"
									stopOpacity={0}
								/>
							</linearGradient>
							{typeof xAxis === "number" && Number.isFinite(xAxis) ? (
								<mask id={idMask}>
									<rect
										fill={`url(#${idMaskGrad})`}
										height="100%"
										width={animationConfig.glowWidth}
										x={xAxis - animationConfig.glowWidth / 2}
										y={0}
									/>
								</mask>
							) : null}
						</defs>
						<Area
							dataKey="you"
							fill={`url(#${idGradYou})`}
							fillOpacity={0.4}
							mask={typeof xAxis === "number" ? `url(#${idMask})` : undefined}
							stackId="a"
							stroke="var(--color-you)"
							strokeWidth={0.8}
							type="linear"
						/>
						<Area
							dataKey="others"
							fill={`url(#${idGradOthers})`}
							fillOpacity={0.4}
							mask={typeof xAxis === "number" ? `url(#${idMask})` : undefined}
							stackId="a"
							stroke="var(--color-others)"
							strokeWidth={0.8}
							type="linear"
						/>
					</AreaChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
