# Bury Steps Walking Group

Next.js (App Router) · Tailwind v4 · shadcn/ui · Clerk · Prisma · Neon Postgres · Vercel

---

## Setup, step by step

Run each block in Terminal, one at a time. Wait for each to finish.

### 1. Scaffold the Next.js app

```bash
npx create-next-app@latest bury-steps \
  --typescript --tailwind --eslint --app --src-dir \
  --import-alias "@/*" --no-turbopack
cd bury-steps
```

### 2. Drop in the files from this bundle

Copy everything from the bundle over the top of the new project, replacing
`src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css` and `src/lib/utils.ts`.

### 3. Install dependencies

```bash
npm install @clerk/nextjs @prisma/client zod nanoid
npm install -D prisma tw-animate-css
```

### 4. Add the shadcn components

```bash
npx shadcn@latest init
npx shadcn@latest add button card input textarea label checkbox badge sonner \
  alert alert-dialog avatar dropdown-menu radio-group select separator \
  skeleton table tabs tooltip
```

When `init` asks about overwriting `globals.css`, choose **no** — the palette in
this bundle is already set up.

### 5. Create the database

1. Sign up at neon.tech and create a project.
2. **Set the region to London (`aws-eu-west-2`)** — see the data note below.
3. Copy the pooled and direct connection strings.

### 6. Set up Clerk

1. Create an application at clerk.com.
2. Copy the publishable key and secret key.

### 7. Fill in your environment variables

```bash
cp .env.example .env.local
open -e .env.local
```

Paste in the Neon and Clerk values, then save.

### 8. Create the database tables

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 9. Run it

```bash
npm run dev
```

Open http://localhost:3000. **The first account you create becomes the
organiser (ADMIN).** Everyone after that is a member.

### 10. Deploy

```bash
git init && git add -A && git commit -m "Initial commit"
gh repo create bury-steps --private --source=. --push
npx vercel
```

Then in the Vercel dashboard, add every variable from `.env.local` under
Settings → Environment Variables, set `NEXT_PUBLIC_APP_URL` to your live
domain, and redeploy.

### 11. Point the Clerk webhook at the live site (optional)

Clerk Dashboard → Webhooks → add endpoint `https://your-domain/api/webhooks/clerk`,
subscribe to `user.created`, `user.updated`, `user.deleted`, then copy the
signing secret into `CLERK_WEBHOOK_SIGNING_SECRET` on Vercel.

---

## How the pieces fit

| Route | Who | Does |
|---|---|---|
| `/` | Anyone | Landing page |
| `/dashboard` | Members | Upcoming walks, clock-in status, own history |
| `/admin` | Organisers | Create walks, copy share links |
| `/admin/walks/[id]` | Organisers | Live roster, CSV export, cancel walk |
| `/w/[token]` | Members | Pre-walk check and clock in |
| `/api/cron/purge-conditions` | Vercel Cron | Clears health notes after 90 days |

### Attendance integrity

- `clockedInAt` is a database default. The browser never supplies a timestamp.
- `@@unique([walkId, userId])` makes double clock-ins impossible, not just
  discouraged.
- Clock-in only works from 1 hour before the start until 1 hour after the
  expected finish (`src/lib/walk-window.ts`).
- Walk links are protected by Clerk. Having the link is not enough — you have
  to be a signed-in member.

### Time zones

Everything is stored in UTC and rendered with `timeZone: "Europe/London"`, so
BST and GMT both display correctly. Organisers type UK wall-clock time into the
form and `londonWallClockToUtc()` converts it. The one edge case is the
ambiguous hour when the clocks go back in October — it resolves to BST.

---

## Data protection note

The conditions field is special category health data under UK GDPR Article 9,
so the app is built to handle it accordingly:

- The tick box is worded as **explicit consent**, not just an acknowledgement.
  Article 9 needs consent to be explicit and specific.
- Health notes auto-delete 90 days after the walk. Change
  `CONDITIONS_RETENTION_DAYS` in `src/server/actions.ts` if you want a
  different period, and say so in your privacy notice.
- Only `ADMIN` accounts can read conditions. Keep the number of organiser
  accounts small.
- The database is in London, so data stays in the UK.

Still to do on your side: write a short privacy notice covering what you
collect, why, how long you keep it, and who sees it, and link it from the
clock-in page. If the group is part of a constituted organisation, it may also
need to register with the ICO — worth a check, it's inexpensive.

I'm not a lawyer and this isn't legal advice; it's the standard shape for this
kind of app.

---

## Next things worth building

- Recurring weekly walks instead of creating each one by hand
- Emergency contact on the member profile rather than per walk
- Organiser-side manual clock-in for members whose phone died
- QR code on the walk link so the leader can show it at the meeting point

---

## Environment variables

Set every one of these in **Vercel → Settings → Environment Variables**, ticked
for Production, Preview and Development. Local values go in `.env.local`,
which is gitignored — never commit it.

| Variable | Where to get it | Secret? |
|---|---|---|
| `DATABASE_URL` | Neon → Connection Details → **Pooled** connection | Yes |
| `DIRECT_URL` | Neon → Connection Details → uncheck "Pooled" | Yes |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk → API Keys → Publishable key | No |
| `CLERK_SECRET_KEY` | Clerk → API Keys → Secret key | Yes |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Clerk → Webhooks → your endpoint → Signing Secret | Yes |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Literal value: `/sign-in` | No |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Literal value: `/sign-up` | No |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | Literal value: `/dashboard` | No |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | Literal value: `/dashboard` | No |
| `NEXT_PUBLIC_APP_URL` | Your live domain, no trailing slash | No |
| `CRON_SECRET` | Generate with `openssl rand -hex 32` | Yes |

`NEXT_PUBLIC_APP_URL` must differ per environment — `http://localhost:3000`
locally, your real domain in Production. If it's wrong, the share links you
copy will point at the wrong place.

### Clerk application settings

In the Clerk dashboard for your app:

- **User & Authentication → Email, Phone, Username**: enable Email address and
  Password. Turn on "Require" for email verification.
- **User & Authentication → Social Connections**: Google is worth enabling —
  it removes the password-reset support burden for older members.
- **Paths**: set Sign-in to `/sign-in` and Sign-up to `/sign-up`.
- **Domains**: add your Vercel production domain once deployed. Clerk's test
  keys (`pk_test_` / `sk_test_`) work fine for a group this size, but switch to
  production keys before you share the link widely.

### Making someone else an organiser

Roles live in the database, not Clerk. Easiest way:

```bash
npx prisma studio
```

Open the `User` table, change their `role` from `MEMBER` to `ADMIN`, save.
