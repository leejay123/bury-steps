---
name: bury-steps
description: How to change, test and ship the Bury Steps walking group site safely. Use for ANY code change to this repo (pages, drawers, settings, designers, server actions, styles), before testing it, and before pushing — pushing main deploys the live site.
---

# Bury Steps: changing, testing and shipping

The owner is non-technical: explain every change in plain words, step by step, and say what is
live. Do only what was asked; suggest anything extra instead of doing it.

## The repo and the live site

- Next.js 16 (App Router, Cache Components), React 19, Prisma 6 on Supabase Postgres, Clerk 7
  (`src/proxy.ts`), Tailwind 4 + shadcn, Puck 0.23 for the page and walk designers. Vercel Pro.
- **Pushing `main` deploys production** (burysteps-walkinggroup.co.uk). Preview deploys share the
  LIVE database. Local `.env.local` also points at the live database with Clerk development keys.
- Other sessions (Cursor, other Claude windows) edit and push the same repo all day. The main
  checkout has their unsaved work: **never** `git checkout -- .`, `reset`, `stash` or `add -A` there.

## Work in a fresh copy, every time

```bash
cd <repo> && git fetch -q origin main && git worktree prune
git worktree add --detach <scratchpad>/wtN origin/main
cd <scratchpad>/wtN && cp <repo>/.env.local . && npm ci && npx prisma generate
```

Edit only there. Add named files only (`git add path/to/file`), never a whole folder.

## Check before pushing (all of them)

1. `npx tsc --noEmit` (errors from `.next/dev/types` after deleting a test page are stale — ignore).
2. `npx eslint <changed files>` and `npx vitest run`.
3. **Full production build with the database settings loaded** (the build prerenders every page):
   `rm -rf .next && bash -c 'set -a; . ./.env.local; set +a; node scripts/next-build.mjs'`
   - Not `npm run build` (it runs migrations). Without the env, the script uses a dummy database
     and pages fail to prerender — that is not your bug.
   - Expect `✓ Generating static pages … (91/91)`.

## Seeing it in a browser without touching live data

Signed-in pages can't be opened locally. Make a throwaway page and delete it before committing:

- Put it under `src/app/(site)/w/zz-<name>/page.tsx` (`/w/*` is public) and render the real
  component with fake props. Never press save/publish buttons that hit the live database.
- Start `npx next dev -p <port>`; drive it with Playwright imported from
  `<repo>/node_modules/playwright/index.mjs`.
- The signed-in look (edge-to-edge sections) needs `document.documentElement.setAttribute("data-remembered-in", "")`;
  the role-dependent parts need `data-sb-role` = `member` | `organiser` | `owner`.
- Screenshot desktop (1280) and phone (390), and the loading placeholder. Remove the test page,
  stop the server, then build.
- Don't open a designer on the live site to look at it: closing it saves a draft.

## Push, then watch the deploy

1. `git fetch`; if `origin/main` moved, read those commits (`git log --stat HEAD..origin/main`)
   for overlap, `git rebase origin/main`, resolve by hand keeping both sides, recheck, rebuild.
2. Commit with a clear message (what changed and why) and the attribution lines, then
   `git push origin HEAD:main`.
3. Watch the production deployment for that commit until READY (Vercel project
   `prj_8X73GobJS8TmmlDweF8BZRsnfYeW`, team `sheenahall123-6716s-projects`), then check runtime
   errors since the deploy. A deploy in ERROR from another session blocks everyone — say so and fix
   only the clear, minimal cause.
4. Remove the worktree.

## House rules for the UI

- **Placeholders match the page.** Every loading state draws the same layout with grey shapes
  (`Skeleton`) for data-dependent bits — never an empty gap, never a different row count. Show
  role-only rows from `html[data-sb-role]` (see `src/components/list-skeletons.tsx`).
- **No reveal animations**: placeholders swap to content instantly.
- **Edge to edge**: use the existing pieces, not new CSS — `data-edge-stats` (a row of boxes),
  `EdgeBar` + `EDGE_FILTER` (full-height segments split by lines; `src/components/edge-search.tsx`),
  `DataList` with `data-edge-top`, `data-edge-note` (a full-width strip). The rules live in
  `src/components/shadcnio/shadcnio.css`.
- No new double borders, missing borders or gaps: compare before/after screenshots.
- Consistent labels and controls across pages; don't abbreviate.
- Colours and fonts come from the site's tokens (`bg-background`, `text-muted-foreground`, …) so
  Branding → Site design and the Customize panel (theme, base, Style = font, radius) still apply.
  Never fix a font on an element (`--font-site` drives the text).
- Walk wording owners can edit comes from `useWalkWording()` + `fillWording()` — reuse it.
- Pages fetched ahead: `export const prefetch = "partial"`, personal data in
  `"use cache: private"` with `cacheLife(PRIVATE_SAVED_COPY)`, rows as `IntentLink full`. Saves
  call `revalidatePath` from `@/lib/revalidate` for the list and the item's own page.

## Auth and data

- `src/proxy.ts` deliberately checks organiser/owner roles from the session token before any
  page draws; every server action also checks (`guardForm`/`guardArgs` + permission checks).
  Keep both. The Clerk skills' "keep clerkMiddleware bare" advice does not override this.
- Never run `clerk init` or create Clerk apps or keys; testing with real sign-in needs the owner's
  Clerk development setup first.
- Database: the connection pool is small (pooler 200 clients, app pool 15). Avoid bursts of
  deploys and local dev against the live DB; batch queries; see `supabase-postgres-best-practices`
  for indexes and connections.
