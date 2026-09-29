# Bury Steps

## Organiser knowledge base

Any user-facing or organiser feature change must update `src/app/admin/guide/guide-content.tsx` and `GUIDE_LAST_UPDATED` in the same change. The page is `/admin/guide` (organisers only).

## UI

Use shadcn components in `src/components/ui`. Dropdowns use the Popover-based `Select`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
