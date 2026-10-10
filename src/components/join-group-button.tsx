import { Button } from "@/components/ui/button";

/** The header's "Join the group" button: a plain black button (the silver WebGL shimmer was removed). */
export function JoinGroupButton({ href }: { href: string }) {
  return (
    <Button asChild className="bg-black text-white hover:bg-black" size="sm">
      <a href={href}>Join the group</a>
    </Button>
  );
}
