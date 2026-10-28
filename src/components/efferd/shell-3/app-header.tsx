"use client";
import Link from "next/link";

import { BellIcon, SendIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AppBreadcrumbs } from "./app-breadcrumbs";
import { CustomSidebarTrigger } from "./custom-sidebar-trigger";
import { useShellNav } from "../shell-nav";
import { NavUser } from "./nav-user";


export function AppHeader() {
	const { navLinks } = useShellNav();
	// Organisers-only pages show only for people whose menu has them.
	const has = (href: string) => navLinks.some((item) => item.url === href);
	const activeItem = navLinks.find((item) => item.isActive);
	return (
		<header
			className={cn(
				"sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4 md:px-6"
			)}
		>
			<div className="flex items-center gap-3">
				<CustomSidebarTrigger />
				<Separator
					className="mr-2 h-4 data-[orientation=vertical]:self-center"
					orientation="vertical"
				/>
				<AppBreadcrumbs page={activeItem} />
			</div>
			<div className="flex items-center gap-3">
				{has("/admin/messages") ? (
				<Button aria-label="Messages" asChild size="icon-sm" variant="outline">
					<Link href="/admin/messages">
						<SendIcon />
					</Link>
				</Button>
				) : null}
				<Button aria-label="Notices" asChild size="icon-sm" variant="outline">
					<Link href="/notices">
						<BellIcon />
					</Link>
				</Button>
				<Separator
					className="h-4 data-[orientation=vertical]:self-center"
					orientation="vertical"
				/>
				<NavUser />
			</div>
		</header>
	);
}
