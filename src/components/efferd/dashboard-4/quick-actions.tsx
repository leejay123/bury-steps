"use client";

import Link from "next/link";
import {
	BarChart3Icon,
	BellIcon,
	CalendarPlusIcon,
	ChevronRightIcon,
	ClipboardListIcon,
	FootprintsIcon,
	HistoryIcon,
	SendIcon,
	SettingsIcon,
} from "lucide-react";
import { useDashboardData } from "../dashboard-context";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";

const MEMBER_ACTIONS = [
	{ title: "See the walks", description: "Dates, routes and meeting points.", href: "/walks", icon: <FootprintsIcon aria-hidden="true" /> },
	{ title: "Read notices", description: "News from the organisers.", href: "/notices", icon: <BellIcon aria-hidden="true" /> },
	{ title: "Group progress", description: "How far the group has walked.", href: "/progress", icon: <BarChart3Icon aria-hidden="true" /> },
	{ title: "Your history", description: "Every walk you have clocked in to.", href: "/history", icon: <HistoryIcon aria-hidden="true" /> },
] as const;

const ORGANISER_ACTIONS = [
	{ title: "Create a walk", description: "Add a walk to the calendar.", href: "/admin/walks", icon: <CalendarPlusIcon aria-hidden="true" /> },
	{ title: "Message members", description: "Email or text the group.", href: "/admin/messages", icon: <SendIcon aria-hidden="true" /> },
	{ title: "Reports", description: "Clock-ins and attendance.", href: "/admin/reports", icon: <ClipboardListIcon aria-hidden="true" /> },
	{ title: "Settings", description: "Branding, wording and more.", href: "/admin/settings", icon: <SettingsIcon aria-hidden="true" /> },
] as const;

export function QuickActions() {
	const actions = useDashboardData().organiser ? ORGANISER_ACTIONS : MEMBER_ACTIONS;
	return (
		<Card>
			<CardHeader>
				<CardTitle >Quick actions</CardTitle>
				<CardDescription>Shortcuts to the pages you use most.</CardDescription>
			</CardHeader>
			<CardContent>
				<ItemGroup className="gap-0">
					{actions.map((a) => (
						<Item asChild key={a.title} size="sm">
							<Link href={a.href}>
								<ItemMedia variant="icon">{a.icon}</ItemMedia>
								<ItemContent>
									<ItemTitle>{a.title}</ItemTitle>
									<ItemDescription className="line-clamp-1">
										{a.description}
									</ItemDescription>
								</ItemContent>
								<ItemActions>
									<ChevronRightIcon
										aria-hidden="true"
										className="size-4 shrink-0 text-muted-foreground"
									/>
								</ItemActions>
							</Link>
						</Item>
					))}
				</ItemGroup>
			</CardContent>
		</Card>
	);
}
