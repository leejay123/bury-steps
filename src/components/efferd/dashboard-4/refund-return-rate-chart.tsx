"use client";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
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
import { Delta, DeltaIcon, DeltaValue } from "../delta";
import { useDashboardData } from "../dashboard-context";
const chartConfig = {
	walkers: {
		label: "Walkers",
		color: "var(--chart-1)",
	},
} satisfies ChartConfig;
export function RefundReturnRateChart() {
	const { perWalk, organiser } = useDashboardData();
	const first = perWalk[0]?.walkers ?? 0;
	const lastW = perWalk.at(-1)?.walkers ?? first;
	const returnTrendPct = first > 0 ? ((lastW - first) / first) * 100 : 0;
	const average = perWalk.length
		? Math.round((perWalk.reduce((sum, row) => sum + row.walkers, 0) / perWalk.length) * 10) / 10
		: 0;
	return (
		<Card className="md:col-span-2">
			<CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
				<div className="space-y-1">
					<CardTitle >Walkers per walk</CardTitle>
					<CardDescription>Last {perWalk.length || 7} walks</CardDescription>
				</div>
				<div className="space-y-1">
					<CardTitle className="text-right">
						{average}
					</CardTitle>
					<CardDescription>walkers on average</CardDescription>
				</div>
			</CardHeader>
			<CardContent className="mt-auto">
				<ChartContainer
					className="aspect-auto h-56 w-full"
					config={chartConfig}
				>
					<LineChart
						accessibilityLayer
						data={perWalk}
						margin={{ left: 12, right: 12, top: 12, bottom: 0 }}
					>
						<CartesianGrid horizontal={false} strokeDasharray="3 3" />
						<XAxis
							axisLine={false}
							dataKey="day"
							interval={1}
							minTickGap={8}
							tickLine={false}
							tickMargin={8}
						/>
						<ChartTooltip content={<ChartTooltipContent indicator="line" />} />
						<Line
							dataKey="walkers"
							dot={false}
							stroke="var(--color-walkers)"
							strokeWidth={2.5}
							type="monotone"
						/>
					</LineChart>
				</ChartContainer>
			</CardContent>
			<CardFooter>
				<div className="flex min-w-0 flex-1 flex-wrap items-center gap-1 text-muted-foreground text-xs">
					<Delta value={returnTrendPct}>
						<DeltaIcon />
						<DeltaValue />
					</Delta>
					<span className="inline-flex min-w-0 text-pretty">
						latest walk against the first of these
					</span>
				</div>
				<Button
					asChild
					className="text-muted-foreground"
					size="xs"
					variant="ghost"
				>
					<Link href={organiser ? "/admin/reports" : "/history"}>
						{organiser ? "Reports" : "Your history"}
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
