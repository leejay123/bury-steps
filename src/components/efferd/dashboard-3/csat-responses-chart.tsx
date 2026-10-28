"use client";

import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";
import { Bar, BarChart, Rectangle, XAxis } from "recharts";
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
import { formatDate } from "../formater";
import { useDashboardData } from "../dashboard-context";

const chartConfig = {
	you: {
		label: "You",
		color: "var(--chart-1)",
	},
	others: {
		label: "Everyone else",
		color: "var(--chart-5)",
	},
} satisfies ChartConfig;

/** Half of bar width (8) so ends read as fully rounded “caps”. */
const BAR_RADIUS = 5;

/**
 *  column hover background.
 */
function ColumnHoverCursor(props: React.ComponentProps<typeof Rectangle>) {
	return (
		<Rectangle
			fill="var(--muted)"
			fillOpacity={0.5}
			radius={BAR_RADIUS * 2}
			stroke="none"
			{...props}
		/>
	);
}

export function CsatResponsesChart({
	className,
	...props
}: ComponentProps<typeof Card>) {
	const chartData = useDashboardData().weeks.slice(-10);
	return (
		<Card
			className={cn("shadow-none md:col-span-2 dark:ring-0", className)}
			{...props}
		>
			<CardHeader>
				<CardTitle >Weekly clock-ins</CardTitle>
				<CardDescription>
					Yours and everyone else’s, per week, last 10 weeks.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer className="aspect-video w-full" config={chartConfig}>
					<BarChart accessibilityLayer data={chartData}>
						<XAxis
							axisLine={false}
							dataKey="date"
							interval={0}
							minTickGap={8}
							tickFormatter={(value) => formatDate(String(value), "day-month")}
							tickLine={false}
							tickMargin={10}
						/>
						<ChartTooltip
							content={<ChartTooltipContent hideLabel />}
							cursor={<ColumnHoverCursor />}
						/>
						<Bar
							background={{
								fill: "var(--muted)",
								radius: BAR_RADIUS,
							}}
							barSize={8}
							dataKey="others"
							fill="var(--color-others)"
							overflow="visible"
							radius={[0, 0, BAR_RADIUS, BAR_RADIUS]}
							stackId="csat"
						/>
						<Bar
							barSize={8}
							dataKey="you"
							fill="var(--color-you)"
							overflow="visible"
							radius={[BAR_RADIUS, BAR_RADIUS, 0, 0]}
							stackId="csat"
						/>
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
