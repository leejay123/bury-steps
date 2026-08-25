import Link from "next/link";
import { cn } from "@/lib/utils";

export function AdminNav({ current }: { current: "walks" | "members" | "settings" }) {
  const link = (href: string, id: "walks" | "members" | "settings", label: string) => (
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
      {link("/admin/members", "members", "Members")}
      {link("/admin/settings", "settings", "Settings")}
    </nav>
  );
}
