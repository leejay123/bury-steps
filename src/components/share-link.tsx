"use client";

import { toast } from "sonner";
import { CopyButton } from "@/components/animate-ui/components/buttons/copy";

export function ShareLink({ url }: { url: string }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
      <code className="min-h-8 min-w-0 flex-1 break-all rounded-md bg-muted px-3 py-1.5 text-sm leading-snug">
        {url}
      </code>
      <CopyButton
        className="h-8 w-full gap-1.5 px-3 text-sm font-medium sm:w-auto sm:shrink-0"
        content={url}
        copiedLabel="Copied"
        delay={2000}
        label="Copy"
        onCopiedChange={(copied) => {
          if (copied) toast.success("Link copied.");
        }}
        onCopyError={() => toast.error("Could not copy. Select the link and copy it manually.")}
        type="button"
        variant="outline"
      />
    </div>
  );
}
