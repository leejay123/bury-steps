"use client";
import Link from "next/link";

import { PlusIcon, BellIcon } from "lucide-react";

import { LogoIcon } from "../logo";
import { Button } from "@/components/ui/button";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavGroup } from "./nav-group";
import { useShellNav } from "../shell-nav";
import { LatestChange } from "./latest-change";

export function AppSidebar() {
	const { footerNavLinks, navGroups } = useShellNav();
	return (
		<Sidebar collapsible="icon" variant="floating">
			<SidebarHeader className="h-14 justify-center">
				<SidebarMenuButton asChild>
					<Link href="/dashboard">
						<LogoIcon />
						<span className="font-medium">Bury Steps</span>
					</Link>
				</SidebarMenuButton>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarMenuItem className="flex items-center gap-2">
						<SidebarMenuButton
							asChild
							className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
							tooltip="Walks"
						>
							<Link href="/walks">
								<PlusIcon
								/>
								<span>Walks</span>
							</Link>
						</SidebarMenuButton>
						<Button
							aria-label="Notices"
							asChild
							className="size-8 group-data-[collapsible=icon]:opacity-0"
							size="icon"
							variant="outline"
						>
							<Link href="/notices">
								<BellIcon
								/>
								<span className="sr-only">Notices</span>
							</Link>
						</Button>
					</SidebarMenuItem>
				</SidebarGroup>
				{navGroups.map((group, index) => (
					<NavGroup key={`sidebar-group-${index}`} {...group} />
				))}
			</SidebarContent>
			<SidebarFooter>
				<LatestChange />
				<SidebarMenu className="mt-2">
					{footerNavLinks.map((item) => (
						<SidebarMenuItem key={item.title}>
							<SidebarMenuButton
								asChild
								className="text-muted-foreground"
								isActive={item.isActive}
								size="sm"
							>
								<Link href={item.path}>
									{item.icon}
									<span>{item.title}</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}
