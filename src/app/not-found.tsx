import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="space-y-4 py-12 text-center">
      <h1 className="text-xl font-semibold">That link does not exist</h1>
      <p className="text-sm text-muted-foreground">
        The walk link may be mistyped, or the walk may have been removed.
      </p>
      <Button asChild variant="outline">
        <Link href="/">Home</Link>
      </Button>
    </div>
  );
}
