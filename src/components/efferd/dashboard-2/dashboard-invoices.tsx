"use client";

import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { DashboardCard } from "./dashboard-card";
import { useDashboardData, walkDate } from "../dashboard-context";


export function DashboardInvoices() {
	const { recent: invoices, organiser } = useDashboardData();
	return (
		<DashboardCard className="relative gap-0 md:col-span-2">
			<CardHeader className="border-b">
				<CardTitle className="text-base">Recent walks</CardTitle>
				<CardDescription>The latest walks and how many came.</CardDescription>
			</CardHeader>
			<CardContent className="mask-b-from-50% mask-b-to-100% px-0">
				<Table>
					<TableCaption className="sr-only">
						Recent walks with date and walkers.
					</TableCaption>
					<TableHeader>
						<TableRow>
							<TableHead className="ps-6">Walk</TableHead>
							<TableHead>Date</TableHead>
							<TableHead className="pe-6 text-right tabular-nums">
								Walkers
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{invoices.map((inv) => (
							<TableRow className="h-12" key={inv.id}>
								<TableCell className="max-w-40 truncate ps-6 font-medium">
									<Link className="hover:underline" href={inv.href}>
										{inv.title}
									</Link>
								</TableCell>
								<TableCell className="text-muted-foreground tabular-nums">
									{walkDate(inv.startsAt)}
								</TableCell>
								<TableCell className="pe-6 text-right tabular-nums">
									{inv.walkers}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CardContent>
			<div className="mask-t-from-30% absolute inset-x-0 bottom-0 flex h-1/5 items-center justify-center bg-background">
				<Button asChild className="relative" variant="ghost">
					<Link href={organiser ? "/admin/walks" : "/history"}>
						View All
						<ArrowRightIcon
							aria-hidden="true"
						/>
					</Link>
				</Button>
			</div>
		</DashboardCard>
	);
}
