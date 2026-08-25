import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { SignedOut } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Bury Steps Walking Group</h1>
        <p className="text-muted-foreground">
          Weekly walks around Bury and the surrounding countryside. Create an account to see
          what&rsquo;s coming up, then clock in when you arrive.
        </p>
      </div>
      <div className="flex gap-3">
        <SignedOut>
          <Button asChild>
            <Link href="/sign-up">Join the group</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </SignedOut>
      </div>
    </div>
  );
}
