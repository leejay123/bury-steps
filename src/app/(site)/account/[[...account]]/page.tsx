import type { Metadata } from "next";
import { Suspense } from "react";
import { ClerkIsland } from "@/components/clerk-island";
import { PageTop } from "@/components/page-top";
import { AccountProfile, AccountProfilePlaceholder } from "./account-profile";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};

/**
 * "Manage account" from the account menu: Clerk's account editor on its own
 * page in the dashboard instead of a pop-up. Clerk asks for it in an optional
 * catch-all route, inside Suspense (it reads the URL):
 * https://clerk.com/docs/nextjs/reference/components/user/user-profile
 */
export default function AccountPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageTop
        className="space-y-1"
        eyebrow="Account"
        intro="Your name, photo, email addresses, password and ways of signing in."
        title="Account"
      />
      <Suspense fallback={<AccountProfilePlaceholder />}>
        <ClerkIsland>
          <AccountProfile />
        </ClerkIsland>
      </Suspense>
    </div>
  );
}
