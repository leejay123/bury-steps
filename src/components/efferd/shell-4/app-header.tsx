"use client";
import Link from "next/link";

import { BellIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AppBreadcrumbs } from "./app-breadcrumbs";
import { CustomSidebarTrigger } from "./custom-sidebar-trigger";
import { useShellNav } from "../shell-nav";
import { NavUser } from "./nav-user";


export function AppHeader() {
	const { navLinks } = useShellNav();
	const activeItem = navLinks.find((item) => item.isActive);
	return (
		<header
			className={cn(
				"pxx-4 mb-6 flex items-center justify-between gap-2 md:px-2"
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
				<Button aria-label="Notices" asChild size="icon" variant="ghost">
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
