"use client";

import Link from "next/link";
import { ArrowRightIcon, MapPinIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useDashboardData, walkDate, walkIn } from "../dashboard-context";

function statusVariant(
	when: string
): ComponentProps<typeof Badge>["variant"] {
	if (when === "Today") {
		return "destructive";
	}
	if (when === "Tomorrow") {
		return "secondary";
	}
	return "outline";
}

export function RecentConversations({
	className,
	...props
}: ComponentProps<typeof Card>) {
	const { upcoming: rows, organiser } = useDashboardData();
	return (
		<Card
			className={cn("gap-0 shadow-none md:col-span-2 dark:ring-0", className)}
			{...props}
		>
			<CardHeader className="border-b">
				<CardTitle >Walks coming up</CardTitle>
				<CardDescription>The next {rows.length || ""} walks on the calendar</CardDescription>
			</CardHeader>
			<CardContent className="p-0">
				<Table>
					<TableHeader>
						<TableRow className="hover:bg-transparent">
							<TableHead className="pl-6">Walk</TableHead>
							<TableHead className="hidden sm:table-cell">Leader</TableHead>
							<TableHead>Meeting point</TableHead>
							<TableHead className="text-right">Date</TableHead>
							<TableHead className="pr-6 text-right">When</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{rows.map((r) => {
							const when = walkIn(r.startsAt);
							return (
								<TableRow
									className="h-14 hover:bg-transparent"
									key={r.id}
								>
									<TableCell className="max-w-36 truncate pl-6 font-medium">
										<Link className="hover:underline" href={r.href}>
											{r.title}
										</Link>
									</TableCell>
									<TableCell className="hidden max-w-32 sm:table-cell">
										<span className="line-clamp-1 text-muted-foreground text-sm">
											{r.leader ?? "—"}
										</span>
									</TableCell>
									<TableCell className="max-w-36">
										<span className="inline-flex max-w-full items-center gap-2 font-medium text-sm">
											<MapPinIcon className="size-3.5 shrink-0" />
											<span className="truncate">{r.location ?? "—"}</span>
										</span>
									</TableCell>
									<TableCell className="text-right text-muted-foreground text-sm">
										{walkDate(r.startsAt)}
									</TableCell>
									<TableCell className="pr-6 text-right">
										<Badge suppressHydrationWarning variant={statusVariant(when)}>
											{when}
										</Badge>
									</TableCell>
								</TableRow>
							);
						})}
						{rows.length === 0 ? (
							<TableRow className="hover:bg-transparent">
								<TableCell className="pl-6 text-muted-foreground" colSpan={5}>
									No walks coming up yet.
								</TableCell>
							</TableRow>
						) : null}
					</TableBody>
				</Table>
				<div className="flex justify-center border-t py-3">
					<Button asChild size="sm" variant="ghost">
						<Link href={organiser ? "/admin/walks" : "/walks"}>
							View all walks
							<ArrowRightIcon
								aria-hidden="true"
								data-icon="inline-end"
							/>
						</Link>
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
