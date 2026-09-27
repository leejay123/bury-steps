import Link from "next/link";
import { Button } from "@/components/ui/button";
import { JoinGroupButton } from "@/components/join-group-button";

export function HomeCta({
  isSignedIn,
  signInHref,
  signUpHref,
}: {
  isSignedIn: boolean;
  signInHref: string;
  signUpHref: string;
}) {
  return (
    <section className="px-4 py-10 md:px-6 md:py-14">
      <div className="relative flex flex-col items-center gap-5 overflow-hidden rounded-2xl border bg-muted/40 px-6 py-12 text-center md:py-16">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,theme(--color-foreground/.06),transparent_70%)]"
        />
        <h2 className="max-w-xl text-balance text-2xl font-semibold tracking-tight text-foreground md:text-4xl">
          {isSignedIn ? "See you on Sunday" : "Ready to take the first step?"}
        </h2>
        <p className="max-w-md text-muted-foreground">
          {isSignedIn
            ? "Check the next walk, clock in on the day, and bring a friend."
            : "Come as you are. No fitness level, no pace, no pressure — just people walking together."}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {isSignedIn ? (
            <Button asChild size="sm">
              <Link href="/walks">See upcoming walks</Link>
            </Button>
          ) : (
            <>
              <Button asChild size="sm" variant="outline">
                <a href={signInHref}>Sign in</a>
              </Button>
              <JoinGroupButton href={signUpHref} />
            </>
          )}
        </div>
      </div>
    </section>
  );
}
