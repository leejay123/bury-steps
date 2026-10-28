"use client";

import Link from "next/link";
import { ArrowRightIcon, CircleCheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { DashboardCard } from "./dashboard-card";
import { useDashboardData } from "../dashboard-context";

export function BillingHealth() {
	const { notice } = useDashboardData();
	return (
		<DashboardCard className="gap-0">
			<CardHeader className="border-b">
				<CardTitle className="text-balance text-base">Notices</CardTitle>
				<CardDescription className="text-pretty">
					{notice ? "The latest from the organisers." : "Nothing new from the organisers."}
				</CardDescription>
			</CardHeader>
			<CardContent className="flex h-full items-center px-0">
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<CircleCheckIcon
								aria-hidden="true"
							/>
						</EmptyMedia>
						<EmptyTitle className="font-heading">{notice ? notice.title : "You’re caught up."}</EmptyTitle>
						<EmptyDescription className="text-xs">
							{notice ? notice.body : "There are no notices right now."}
						</EmptyDescription>
					</EmptyHeader>
					<EmptyContent>
						<Button asChild variant="ghost">
							<Link href={notice?.href ?? "/notices"}>
								Read notices
								<ArrowRightIcon
									aria-hidden="true"
								/>
							</Link>
						</Button>
					</EmptyContent>
				</Empty>
			</CardContent>
		</DashboardCard>
	);
}
