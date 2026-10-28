"use client";

import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";
import { CartesianGrid, LabelList, Line, LineChart, XAxis } from "recharts";
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
import { Delta, DeltaIcon, DeltaValue } from "../delta";
import { useDashboardData } from "../dashboard-context";


const chartConfig = {
	walkers: {
		label: "Walkers",
		color: "var(--chart-2)",
	},
} satisfies ChartConfig;

export function FirstReplyTimeChart({
	className,
	...props
}: ComponentProps<typeof Card>) {
	const chartRows = useDashboardData().perWalk;
	const first = chartRows[0]?.walkers ?? 0;
	const last = chartRows.at(-1)?.walkers ?? first;
	/** Walkers on the latest walk against the first of these. */
	const replyImprovementPct = first > 0 ? ((last - first) / first) * 100 : 0;
	return (
		<Card
			className={cn("shadow-none md:col-span-2 dark:ring-0", className)}
			{...props}
		>
			<CardHeader className="space-y-1">
				<div className="flex flex-wrap items-center gap-2">
					<CardTitle >Walkers per walk</CardTitle>
					<Delta value={replyImprovementPct} variant="badge">
						<DeltaIcon variant="trend" />
						<DeltaValue />
					</Delta>
				</div>
				<CardDescription>
					Clock-ins on each of the last {chartRows.length || 7} walks.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer className="aspect-video w-full" config={chartConfig}>
					<LineChart
						accessibilityLayer
						data={chartRows}
						margin={{ top: 24, left: 20, right: 12, bottom: 8 }}
					>
						<CartesianGrid className="stroke-border" vertical={false} />
						<XAxis
							axisLine={false}
							dataKey="day"
							interval={0}
							tickFormatter={(value) => String(value)}
							tickLine={false}
							tickMargin={8}
						/>
						<ChartTooltip
							content={<ChartTooltipContent indicator="line" />}
							cursor={false}
						/>
						<Line
							activeDot={{ r: 6 }}
							dataKey="walkers"
							dot={{ fill: "var(--color-walkers)" }}
							stroke="var(--color-walkers)"
							strokeWidth={2}
							type="natural"
						>
							<LabelList
								className="fill-foreground"
								dataKey="walkers"
								fontSize={12}
								formatter={(label) => {
									const n = Number(label);
									return Number.isFinite(n)
										? String(n)
										: String(label ?? "");
								}}
								offset={12}
								position="top"
							/>
						</Line>
					</LineChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
