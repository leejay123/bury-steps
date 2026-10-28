"use client";

import type * as React from "react";
import { Bar, BarChart, XAxis } from "recharts";
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


const chartConfig = {
	clockIns: {
		label: "Clock-ins",
		color: "var(--chart-2)",
	},
} satisfies ChartConfig;

function CustomGradientBar(
	props: React.SVGProps<SVGRectElement> & {
		index?: number;
		dataKey?: string | number;
	}
) {
	const {
		fill,
		x = 0,
		y = 0,
		width = 0,
		height = 0,
		dataKey = "clockIns",
		index = 0,
	} = props;
	const gid = `gradient-bar-${String(dataKey)}-${index}`;

	return (
		<>
			<rect
				fill={`url(#${gid})`}
				height={height}
				stroke="none"
				width={width}
				x={x}
				y={y}
			/>
			<rect fill={fill} height={2} stroke="none" width={width} x={x} y={y} />
			<defs>
				<linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
					<stop offset="0%" stopColor={fill} stopOpacity={0.5} />
					<stop offset="100%" stopColor={fill} stopOpacity={0} />
				</linearGradient>
			</defs>
		</>
	);
}

export function NetRevenueChart() {
	const chartRows = useDashboardData().weekdays;
	// The busiest day against the average day.
	const total = chartRows.reduce((sum, row) => sum + row.clockIns, 0);
	const busiest = Math.max(0, ...chartRows.map((row) => row.clockIns));
	const growthPct = total ? (((busiest - total / 7) / (total / 7)) * 100).toFixed(1) : "0";
	return (
		<DashboardCard className="gap-0 md:col-span-2">
			<CardHeader className="gap-2">
				<div className="flex flex-wrap items-center gap-2">
					<CardTitle >Busiest days</CardTitle>
					<Delta value={Number(growthPct)} variant="badge">
						<DeltaIcon variant="trend" />
						<DeltaValue />
					</Delta>
				</div>
				<CardDescription>Clock-ins by day of the week, last 90 days. The badge is the busiest day against the average.</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer
					className="aspect-auto h-60 w-full md:h-80"
					config={chartConfig}
				>
					<BarChart accessibilityLayer data={chartRows}>
						<XAxis
							axisLine={false}
							dataKey="day"
							interval={0}
							tickFormatter={(value) => String(value)}
							tickLine={false}
							tickMargin={10}
						/>
						<ChartTooltip
							content={<ChartTooltipContent hideLabel />}
							cursor={false}
						/>
						<Bar
							dataKey="clockIns"
							fill="var(--color-clockIns)"
							shape={<CustomGradientBar />}
						/>
					</BarChart>
				</ChartContainer>
			</CardContent>
		</DashboardCard>
	);
}
