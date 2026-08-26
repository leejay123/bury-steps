"use client";

import { usePathname, useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const HREF = {
  walks: "/admin",
  members: "/admin/members",
  settings: "/admin/settings",
  guide: "/admin/guide",
} as const;

export function AdminSectionTabs() {
  const pathname = usePathname();
  const router = useRouter();
  const value = pathname.startsWith("/admin/members")
    ? "members"
    : pathname.startsWith("/admin/settings") || pathname.startsWith("/admin/homepage")
      ? "settings"
      : pathname.startsWith("/admin/guide")
        ? "guide"
        : "walks";

  return (
    <Tabs
      value={value}
      onValueChange={(next) => router.push(HREF[next as keyof typeof HREF])}
      className="w-full"
    >
      <TabsList>
        <TabsTrigger value="walks">Walks</TabsTrigger>
        <TabsTrigger value="members">Members</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
        <TabsTrigger value="guide">Guide</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
