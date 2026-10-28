"use client";

import { cn } from "@/lib/utils";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Delta, DeltaIcon, DeltaValue } from "../delta";
import { useDashboardData } from "../dashboard-context";

type Stat = {
	label: string;
	value: string;
	delta: number;
	footnote: string;
	/** When true, a negative delta is treated as favorable (e.g. queue depth, reply time). */
	lowerIsBetter: boolean;
};


export function DashboardStats() {
	const stats: readonly Stat[] = useDashboardData().stats.map((s) => ({
		label: s.label,
		value: s.value,
		delta: s.delta,
		footnote: s.hint,
		lowerIsBetter: false,
	}));
	return (
		<>
			{stats.map((s) => (
				<Card className={cn("shadow-none dark:ring-0")} key={s.label}>
					<CardHeader>
						<CardTitle className="font-normal text-muted-foreground text-xs">
							{s.label}
						</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col gap-2">
						<p className="font-semibold text-2xl tabular-nums">{s.value}</p>
						<div className="flex items-center gap-1 text-xs">
							<Delta value={s.delta}>
								<DeltaIcon />
								<DeltaValue />
							</Delta>
							<span className="text-muted-foreground">{s.footnote}</span>
						</div>
					</CardContent>
				</Card>
			))}
		</>
	);
}
