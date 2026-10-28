"use client";
import Link from "next/link";

import { Logo } from "../logo";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useShellNav } from "../shell-nav";
import { NavUser } from "./nav-user";

export function AppSidebar() {
	const { footerNavLinks, navGroups } = useShellNav();
	return (
		<Sidebar
			className="static min-h-full *:data-[slot=sidebar-inner]:bg-background"
			collapsible="offcanvas"
			variant="sidebar"
		>
			<SidebarHeader className="relative h-14 justify-center px-2 py-0">
				<Link
					className="rounded-lg flex h-10 w-max items-center justify-center px-3 hover:bg-muted dark:hover:bg-muted/50"
					href="/dashboard"
				>
					<Logo className="h-4" />
					<span className="sr-only">Bury Steps</span>
				</Link>
			</SidebarHeader>
			<SidebarContent>
				{navGroups.map((group, index) => (
					<SidebarGroup key={`sidebar-group-${index}`}>
						{group.label && (
							<SidebarGroupLabel className="font-normal">
								{group.label}
							</SidebarGroupLabel>
						)}
						<SidebarMenu>
							{group.items.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton
										asChild
										isActive={item.isActive}
										tooltip={item.title}
									>
										<Link href={item.url}>
											{item.icon}
											<span>{item.title}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroup>
				))}
			</SidebarContent>
			<SidebarFooter className="gap-0 p-0">
				<SidebarMenu className="border-t p-2">
					{footerNavLinks.map((item) => (
						<SidebarMenuItem key={item.title}>
							<SidebarMenuButton
								asChild
								className="text-muted-foreground"
								isActive={item.isActive}
								size="sm"
							>
								<Link href={item.url}>
									{item.icon}
									<span>{item.title}</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
				<NavUser />
			</SidebarFooter>
		</Sidebar>
	);
}
