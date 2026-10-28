"use client";

import { Badge } from "@/components/ui/badge";
import {
	Card,
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
import Link from "next/link";
import { useDashboardData, walkDate, walkIn } from "../dashboard-context";


export function DashboardInvoices() {
	const invoices = useDashboardData().upcoming;
	return (
		<Card className="rounded-none bg-background shadow-none ring-0 lg:col-span-3">
			<CardHeader>
				<CardTitle >Walks coming up</CardTitle>
				<CardDescription>Dates, leaders and who has clocked in.</CardDescription>
			</CardHeader>
			<CardContent className="px-0 pb-2">
				<Table className="border-t">
					<TableCaption className="sr-only">
						Walks coming up with date, leader, walkers and when.
					</TableCaption>
					<TableHeader>
						<TableRow>
							<TableHead className="pl-6">Walk</TableHead>
							<TableHead>Leader</TableHead>
							<TableHead className="text-right tabular-nums">Walkers</TableHead>
							<TableHead className="pr-6 text-right">When</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{invoices.map((inv) => (
							<TableRow className="h-14" key={inv.id}>
								<TableCell className="max-w-40 truncate pl-6 font-medium">
									<Link className="hover:underline" href={inv.href}>
										{inv.title}
									</Link>
								</TableCell>
								<TableCell className="max-w-32 truncate text-muted-foreground">
									{inv.leader ?? "—"}
								</TableCell>
								<TableCell className="text-right tabular-nums">
									{inv.walkers}
								</TableCell>
								<TableCell className="pr-6 text-right">
									<Badge suppressHydrationWarning title={walkDate(inv.startsAt)} variant={walkIn(inv.startsAt) === "Today" ? "secondary" : "outline"}>
										{walkIn(inv.startsAt)}
									</Badge>
								</TableCell>
							</TableRow>
						))}
						{invoices.length === 0 ? (
							<TableRow>
								<TableCell className="pl-6 text-muted-foreground" colSpan={4}>
									No walks coming up yet.
								</TableCell>
							</TableRow>
						) : null}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}
