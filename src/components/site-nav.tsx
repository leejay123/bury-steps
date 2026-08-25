import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";

export async function SiteNav() {
  const { userId } = await auth();
  let isAdmin = false;
  if (userId) {
    try {
      const row = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { role: true },
      });
      isAdmin = row?.role === "ADMIN";
    } catch {
      isAdmin = false;
    }
  }

  return (
    <nav className="flex items-center gap-3 text-sm">
      <SignedOut>
        <SignInButton mode="modal">
          <Button variant="outline" size="sm">
            Sign in
          </Button>
        </SignInButton>
        <SignUpButton mode="modal">
          <Button size="sm">Join the group</Button>
        </SignUpButton>
      </SignedOut>
      <SignedIn>
        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
          Walks
        </Link>
        {isAdmin ? (
          <Link href="/admin/members" className="text-muted-foreground hover:text-foreground">
            Members
          </Link>
        ) : null}
        <UserButton />
      </SignedIn>
    </nav>
  );
}
