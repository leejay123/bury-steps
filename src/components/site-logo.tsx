import Image from "next/image";
import { cn } from "@/lib/utils";

export function SiteLogo({ className }: { className?: string }) {
  return (
    <Image
      alt="Bury Steps Walking Group"
      className={cn("h-8 w-auto object-contain object-left", className)}
      height={448}
      priority
      src="/bury-steps-logo.png"
      width={419}
    />
  );
}
