import Link from "next/link";
import { cn } from "@/lib/utils";

export function AdminNav({ current }: { current: "walks" | "members" | "homepage" }) {
  const link = (href: string, id: "walks" | "members" | "homepage", label: string) => (
    <Link
      href={href}
      className={cn(
        "text-sm underline-offset-4 hover:underline",
        current === id ? "font-medium text-foreground" : "text-muted-foreground",
      )}
    >
      {label}
    </Link>
  );

  return (
    <nav className="flex items-center gap-4">
      {link("/admin", "walks", "Walks")}
      {link("/admin/homepage", "homepage", "Homepage")}
      {link("/admin/members", "members", "Members")}
    </nav>
  );
}
