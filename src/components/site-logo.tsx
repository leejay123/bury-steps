import { cn } from "@/lib/utils";

export function SiteLogo({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt="Bury Steps Walking Group"
      className={cn("h-14 w-auto object-contain object-left", className)}
      src="/bury-steps-logo.png"
    />
  );
}

