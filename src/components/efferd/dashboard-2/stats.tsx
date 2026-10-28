"use client";

import {
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Delta, DeltaIcon, DeltaValue } from "../delta";
import { DashboardCard } from "./dashboard-card";
import { useDashboardData } from "../dashboard-context";

type Stat = {
	label: string;
	value: string;
	delta: number;
	hint: string;
};


export function DashboardStats() {
	const stats: Stat[] = useDashboardData().stats;
	return (
		<>
			{stats.map((s) => (
				<DashboardCard className="" key={s.label}>
					<CardHeader className="flex flex-row items-center justify-between">
						<CardTitle className="font-normal text-xs tracking-wide">
							{s.label}
						</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-row items-center gap-2">
						<p className="font-semibold text-2xl tabular-nums">{s.value}</p>
					</CardContent>
					<CardFooter className="gap-1 rounded-none bg-background text-xs">
						<Delta value={s.delta}>
							<DeltaIcon />
							<DeltaValue />
						</Delta>
						<span className="text-muted-foreground">{s.hint}</span>{" "}
					</CardFooter>
				</DashboardCard>
			))}
		</>
	);
}
