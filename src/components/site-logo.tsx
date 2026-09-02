import Image from "next/image";
import { cn } from "@/lib/utils";

const DEFAULT_LOGO_SRC = "/bury-steps-logo.png";

export function SiteLogo({
  alt = "Bury Steps Walking Group",
  className,
  src = DEFAULT_LOGO_SRC,
}: {
  alt?: string;
  className?: string;
  /** Pass the admin-uploaded logo's URL (from `SiteTheme.logoSrc`) to override the bundled default. */
  src?: string;
}) {
  return (
    <Image
      alt={alt}
      className={cn("h-8 w-auto object-contain object-left", className)}
      height={448}
      priority
      src={src}
      width={419}
    />
  );
}
