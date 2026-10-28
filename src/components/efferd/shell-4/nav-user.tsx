"use client";

import Link from "next/link";
import { BACK_TO_SITE, useShellNav } from "../shell-nav";

import { ArrowLeftIcon, BellIcon, LayoutGridIcon } from "lucide-react";

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


export function NavUser() {
	const { user, signOut } = useShellNav();
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Avatar className="size-8">
					<AvatarImage src={user.avatar} />
					<AvatarFallback>{user.initial}</AvatarFallback>
				</Avatar>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-60">
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
	);
}
