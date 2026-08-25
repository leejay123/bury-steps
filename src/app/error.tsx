"use client";

import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="space-y-4 py-12 text-center">
      <h1 className="text-xl font-semibold">Something went wrong loading this page</h1>
      <p className="text-sm text-muted-foreground">
        Nothing was saved. Try again, and tell an organiser if it keeps happening.
      </p>
      <Button onClick={reset} variant="outline">
        Try again
      </Button>
    </div>
  );
}
