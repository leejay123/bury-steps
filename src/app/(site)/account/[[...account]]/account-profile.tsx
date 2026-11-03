"use client";

import { UserProfile } from "@clerk/nextjs";
import { Skeleton } from "@/components/ui/skeleton";

/** Grey shape where Clerk's account editor goes while it loads. */
export function AccountProfilePlaceholder() {
  return <Skeleton className="h-[40rem] w-full rounded-xl" />;
}

/** Clerk's account editor, filling the page's width. */
export function AccountProfile() {
  return (
    <UserProfile
      appearance={{ elements: { rootBox: "w-full", cardBox: "w-full max-w-none shadow-none border" } }}
      fallback={<AccountProfilePlaceholder />}
      path="/account"
      routing="path"
    />
  );
}
