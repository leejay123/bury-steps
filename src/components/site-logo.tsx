import Image from "next/image";
import { blurImageProps } from "@/lib/blur-image";
import { cn } from "@/lib/utils";

const DEFAULT_LOGO_SRC = "/bury-steps-logo.png";

export function SiteLogo({
  alt = "Bury Steps Walking Group",
  className,
  src = DEFAULT_LOGO_SRC,
  blur = null,
  sizes = "64px",
}: {
  alt?: string;
  className?: string;
  /** Pass the admin-uploaded logo's URL (from `SiteTheme.logoSrc`) to override the bundled default. */
  src?: string;
  /** Soft preview while the logo file loads. */
  blur?: string | null;
  /** How wide the logo shows — the header's is about 32px, the printed report's 56px. */
  sizes?: string;
}) {
  return (
    <Image
      alt={alt}
      className={cn("h-8 w-auto object-contain object-left", className)}
      height={448}
      priority
      sizes={sizes}
      src={src}
      width={419}
      {...blurImageProps(blur)}
    />
  );
}
