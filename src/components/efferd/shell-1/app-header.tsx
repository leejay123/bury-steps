import Link from "next/link";
import { BellIcon, HeadsetIcon, SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { AppBreadcrumbs } from "./app-breadcrumbs";
import { useShellNav } from "../shell-nav";


export function AppHeader() {
	const { navLinks } = useShellNav();
	// Organisers-only pages show only for people whose menu has them.
	const has = (href: string) => navLinks.some((item) => item.url === href);
	const activeItem = navLinks.find((item) => item.isActive);
	return (
		<header
			className={cn(
				"sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between gap-2 bg-background px-4 md:px-6"
			)}
		>
			<div className="flex items-center gap-2">
				<SidebarTrigger className="md:hidden" />
				<Separator
					className="mr-2 data-[orientation=vertical]:h-4 md:hidden"
					orientation="vertical"
				/>
				<AppBreadcrumbs page={activeItem} />
			</div>
			<div className="flex items-center gap-2">
				<Button aria-label="Find a walk" asChild size="icon" variant="ghost">
					<Link href="/walks">
						<SearchIcon />
					</Link>
				</Button>
				<Button aria-label="Notices" asChild size="icon" variant="ghost">
					<Link href="/notices">
						<BellIcon />
					</Link>
				</Button>
				{has("/admin/guide") ? (
				<Button aria-label="Guide" asChild size="icon" variant="ghost">
					<Link href="/admin/guide">
						<HeadsetIcon />
					</Link>
				</Button>
				) : null}
			</div>
		</header>
	);
}
