/** Props for next/image so a stored blur shows at the right size, then sharpens. */
export function blurImageProps(blur: string | null | undefined):
  | { placeholder: "blur"; blurDataURL: string }
  | Record<string, never> {
  if (!blur?.startsWith("data:image/")) return {};
  return { placeholder: "blur", blurDataURL: blur };
}
