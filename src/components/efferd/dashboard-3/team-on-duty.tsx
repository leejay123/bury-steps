"use client";

import Link from "next/link";
import { EllipsisIcon, FootprintsIcon, SendIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusIndicator } from "../indicator";
import { useDashboardData, walkIn } from "../dashboard-context";


function getInitials(name: string) {
	return name
		.split(" ")
		.map((word) => word.charAt(0).toUpperCase())
		.join("");
}

export function TeamOnDuty({
	className,
	...props
}: ComponentProps<typeof Card>) {
	const { leaders, organiser } = useDashboardData();
	const teammates = leaders.map((leader, i) => ({
		id: leader.name,
		name: leader.name,
		status: i === 0 ? "Leading next" : "Coming up",
		open: leader.walks,
		next: leader.next,
		href: leader.href,
	}));

	return (
		<Card className={cn("shadow-none dark:ring-0", className)} {...props}>
			<CardHeader className="border-b">
				<CardTitle >Walk leaders</CardTitle>
				<CardDescription>Who is leading the walks coming up</CardDescription>
			</CardHeader>
			<CardContent className="p-0">
				<ul className="flex flex-col divide-y divide-border">
					{teammates.map((t) => (
						<li
							className="flex items-center gap-2 p-3 first:pt-0 last:pb-0 sm:gap-3"
							key={t.id}
						>
							<Avatar className="size-8">
								<AvatarFallback>{getInitials(t.name)}</AvatarFallback>
							</Avatar>
							<div className="min-w-0 flex-1 pr-1">
								<p className="truncate font-medium text-foreground text-sm leading-snug">
									{t.name}
								</p>
								<p className="flex items-center gap-2 text-[10px] leading-snug">
									<span className="flex shrink-0 items-center gap-1">
										<StatusIndicator
											color={t.status === "Leading next" ? "emerald" : "amber"}
											pulse={t.status === "Leading next"}
										/>
										{t.status}
									</span>
									<span className="inline-flex size-1 rounded-full bg-foreground/80" />
									<span className="tabular-nums" suppressHydrationWarning>{t.open === 1 ? "1 walk" : `${t.open} walks`} · {walkIn(t.next)}</span>
								</p>
							</div>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										aria-label={`Actions for ${t.name}`}
										size="icon-xs"
										variant="ghost"
									>
										<EllipsisIcon
										/>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="min-w-52">
									<DropdownMenuLabel className="font-normal text-muted-foreground text-xs">
										{t.name}
									</DropdownMenuLabel>
									<DropdownMenuSeparator />
									<DropdownMenuItem asChild className="gap-2">
										<Link href={t.href}>
											<FootprintsIcon
												className="size-4 opacity-70"
											/>
											See their next walk
										</Link>
									</DropdownMenuItem>
									{organiser ? (
										<DropdownMenuItem asChild className="gap-2">
											<Link href="/admin/messages">
												<SendIcon
													className="size-4 opacity-70"
												/>
												Message members
											</Link>
										</DropdownMenuItem>
									) : null}
								</DropdownMenuContent>
							</DropdownMenu>
						</li>
					))}
					{teammates.length === 0 ? (
						<li className="p-3 text-muted-foreground text-sm">No walk leaders named yet.</li>
					) : null}
				</ul>
			</CardContent>
		</Card>
	);
}
