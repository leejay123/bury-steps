"use client";

import { FileTextIcon, FootprintsIcon, UserPlusIcon } from "lucide-react";
import {
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { DashboardCard } from "./dashboard-card";
import { useDashboardData } from "../dashboard-context";

const ICONS = {
	"clock-in": <UserPlusIcon />,
	notice: <FileTextIcon />,
	walk: <FootprintsIcon />,
} as const;

export function DashboardActivity() {
	const { activity, organiser } = useDashboardData();
	return (
		<DashboardCard className="gap-0">
			<CardHeader className="border-b">
				<CardTitle >Activity</CardTitle>
				<CardDescription>{organiser ? "Who clocked in most recently." : "Latest walks and notices."}</CardDescription>
			</CardHeader>
			<CardContent className="px-0">
				<ul className="flex flex-col divide-y divide-border">
					{activity.map((item) => (
						<li className="flex h-16 items-center gap-3 px-6" key={item.id}>
							<span
								aria-hidden="true"
								className="flex size-10 shrink-0 items-center justify-center [&_svg]:size-4"
							>
								{ICONS[item.kind]}
							</span>
							<div className="min-w-0 flex-1 space-y-1">
								<p className="line-clamp-1 text-pretty text-foreground text-sm leading-snug">
									{item.title}
								</p>
								<p className="text-muted-foreground text-xs">{item.time}</p>
							</div>
						</li>
					))}
				</ul>
			</CardContent>
		</DashboardCard>
	);
}
