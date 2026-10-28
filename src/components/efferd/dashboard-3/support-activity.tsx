"use client";

import Link from "next/link";
import { ArrowRightIcon, LayersIcon, ShieldCheckIcon, UsersRoundIcon } from "lucide-react";
import { useDashboardData } from "../dashboard-context";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

const ICONS = {
	"clock-in": <UsersRoundIcon />,
	notice: <LayersIcon />,
	walk: <ShieldCheckIcon />,
} as const;

export function SupportActivity({
	className,
	...props
}: ComponentProps<typeof Card>) {
	const { activity, organiser } = useDashboardData();
	return (
		<Card className={cn("gap-0 shadow-none dark:ring-0", className)} {...props}>
			<CardHeader className="border-b">
				<CardTitle >Group activity</CardTitle>
				<CardDescription>{organiser ? "Recent clock-ins." : "Walks and notices."}</CardDescription>
			</CardHeader>
			<CardContent className="px-0">
				<ul className="flex flex-col divide-y divide-border">
					{activity.map((item) => (
						<li className="flex h-18 items-center gap-3 px-3" key={item.id}>
							<span
								aria-hidden="true"
								className="flex size-10 shrink-0 items-center justify-center [&_svg]:size-4"
							>
								{ICONS[item.kind]}
							</span>
							<div className="min-w-0 flex-1 space-y-1">
								<p className="line-clamp-2 text-pretty text-foreground text-xs leading-snug">
									{item.title}
								</p>
								<p className="text-muted-foreground text-xs tabular-nums">
									{item.time}
								</p>
							</div>
						</li>
					))}
				</ul>
			</CardContent>
			<div className="flex items-center justify-center">
				<Button asChild size="sm" variant="ghost">
					<Link href={organiser ? "/admin/reports" : "/notices"}>
						View All
						<ArrowRightIcon
							aria-hidden="true"
							data-icon="inline-end"
						/>
					</Link>
				</Button>
			</div>
		</Card>
	);
}
