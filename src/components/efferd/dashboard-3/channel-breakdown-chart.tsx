"use client";

import { cn } from "@/lib/utils";
import { type ComponentProps, useMemo } from "react";
import { LabelList, Pie, PieChart } from "recharts";
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
	ChartLegend,
	ChartLegendContent,
} from "@/components/ui/chart";
import { useDashboardData } from "../dashboard-context";

const SLICE_PALETTE = ["var(--chart-1)", "var(--chart-3)", "var(--chart-5)", "var(--chart-2)", "var(--chart-4)"] as const;

export function ChannelBreakdownChart({
	className,
	...props
}: ComponentProps<typeof Card>) {
	const grades = useDashboardData().grades;
	// Up to four grades; the rest share a fifth slice.
	const { chartData, chartConfig } = useMemo(() => {
		const top = grades.slice(0, 4);
		const rest = grades.slice(4).reduce((sum, g) => sum + g.share, 0);
		const rows = rest ? [...top, { category: "Others", share: rest }] : top;
		const config: ChartConfig = { share: { label: "Share" } };
		const data = rows.map((row, i) => {
			const key = `g${i}`;
			config[key] = { label: row.category, color: SLICE_PALETTE[i % SLICE_PALETTE.length] };
			return { channel: key, share: row.share, fill: `var(--color-${key})` };
		});
		return { chartData: data, chartConfig: config };
	}, [grades]);
	return (
		<Card
			className={cn("flex flex-col shadow-none dark:ring-0", className)}
			{...props}
		>
			<CardHeader className="items-center space-y-1 pb-0 sm:items-start">
				<div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
					<CardTitle >Walks by grade</CardTitle>
				</div>
				<CardDescription>
					Share of walks held in the last year
				</CardDescription>
			</CardHeader>
			<CardContent className="my-auto">
				<ChartContainer
					className="mx-auto aspect-square max-h-72 w-full"
					config={chartConfig}
				>
					<PieChart accessibilityLayer>
						<Pie
							cornerRadius={8}
							data={chartData}
							dataKey="share"
							innerRadius={36}
							nameKey="channel"
							outerRadius="88%"
							stroke="var(--card)"
							strokeWidth={4}
						>
							<LabelList
								className="fill-background font-medium"
								dataKey="share"
								fill="currentColor"
								fontWeight={500}
								formatter={(label) => {
									const n = Number(label);
									return Number.isFinite(n) ? `${n}%` : String(label ?? "");
								}}
								position="inside"
								stroke="none"
							/>
						</Pie>
						<ChartLegend content={<ChartLegendContent nameKey="channel" />} />
					</PieChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
