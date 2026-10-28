import { cn } from "@/lib/utils";

/** Stands in for Efferd's own logo in their app shells: the group's name. */
export function Logo({ className }: { className?: string }) {
  return <span className={cn("flex items-center font-semibold tracking-tight", className)}>Bury Steps</span>;
}

/** Stands in for Efferd's logo mark: the group's initials. */
export function LogoIcon({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center justify-center text-xs font-bold tracking-tight", className)}>BS</span>
  );
}
