"use client";

import Link from "next/link";
import { BACK_TO_SITE, useShellNav } from "../shell-nav";

import { ArrowLeftIcon, BellIcon, ChevronsUpDownIcon, LayoutGridIcon } from "lucide-react";

import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";


export function NavUser() {
	const { user, signOut } = useShellNav();
	const { isMobile } = useSidebar();

	return (
		<SidebarMenu className="border-t p-2">
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton className="text-muted-foreground">
							<Avatar className="size-5">
								<AvatarImage alt={user.name} src={user.avatar} />
								<AvatarFallback>{user.initial}</AvatarFallback>
							</Avatar>
							<span className="font-medium text-sm">
								{user.name.split(" ")[0]}
							</span>
							<ChevronsUpDownIcon
								className="ml-auto size-3!"
							/>
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align="end"
						className="min-w-48"
						side={isMobile ? "bottom" : "right"}
						sideOffset={4}
					>
						<DropdownMenuGroup>
							<DropdownMenuItem asChild>
								<Link href="/dashboard">
									<LayoutGridIcon />
									Overview
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem asChild>
								<Link href="/email-preferences">
									<BellIcon />
									Email preferences
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem asChild>
								<a href={BACK_TO_SITE}>
									<ArrowLeftIcon />
									Back to the site
								</a>
							</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						{signOut}
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
