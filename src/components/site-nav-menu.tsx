"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function SiteNavMenu({
  isAdmin,
  walksHref,
}: {
  isAdmin: boolean;
  walksHref: string;
}) {
  const items = [
    { href: "/", label: "Home" },
    { href: walksHref, label: "Walks" },
    ...(isAdmin
      ? [
          { href: "/admin/members", label: "Members" },
          { href: "/admin/settings", label: "Settings" },
        ]
      : []),
  ];

  return (
    <>
      <nav className="hidden items-center justify-center gap-6 text-sm md:flex">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-muted-foreground hover:text-foreground"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden" aria-label="Open menu">
            <Menu />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-40" align="center">
          <DropdownMenuGroup>
            {items.map((item) => (
              <DropdownMenuItem key={item.href} asChild>
                <Link href={item.href}>{item.label}</Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
