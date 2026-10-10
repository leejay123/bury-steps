/**
 * A script that runs while the page is first read (a refresh or direct
 * visit), before anything is drawn, and is ignored when React draws the
 * same component on a later page change. From the Next.js guide
 * "Preventing flash before hydration" (node_modules/next/dist/docs/01-app/
 * 02-guides/preventing-flash-before-hydration.md) and its demo
 * (github.com/vercel-labs/preventing-flash-before-hydration).
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      dangerouslySetInnerHTML={{ __html: html }}
      suppressHydrationWarning
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
    />
  );
}
