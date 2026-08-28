# Bury Steps Walking Group

A website for a walking group. Members create an account, organisers add walks,
and people clock in when they arrive.

You set this up in the browser. You do **not** need Terminal, Node.js, or to
run anything on your own computer. When you finish, the site is live on the
internet.

You will use three free websites:

| Website | What it does for this app | Open this |
|---|---|---|
| **Clerk** | The login box (sign up and sign in) | [dashboard.clerk.com](https://dashboard.clerk.com) |
| **Supabase** | The database (walks, members, clock-ins) | [supabase.com/dashboard](https://supabase.com/dashboard) |
| **Vercel** | Hosts the website | [vercel.com](https://vercel.com) |

You will copy **three values** from Clerk and Supabase, paste them into Vercel,
and press deploy. Keep a notes app or a blank document open so you can paste
as you go.

---

## Before you start

1. Sign up at [GitHub](https://github.com) if you do not have an account.
   Vercel uses GitHub to get the code.
2. Sign up at [Clerk](https://dashboard.clerk.com),
   [Supabase](https://supabase.com/dashboard) and
   [Vercel](https://vercel.com). Google or GitHub login is fine for all of them.
3. Open this code on GitHub:
   [https://github.com/leejay123/bury-steps](https://github.com/leejay123/bury-steps)

If this is **not** your repository, click **Fork** (top right) so you have your
own copy. Vercel will deploy your copy.

---

## Step 1 — Clerk (two keys)

This is the login system.

1. Open [https://dashboard.clerk.com](https://dashboard.clerk.com).
2. Click **Create application**.
3. Name it `Bury Steps`.
4. Tick **Email**. You can also tick **Google** so people can sign in with a
   Google account.
5. Create the application.
6. You should now see **API keys**. If not, look in the left sidebar for
   **API Keys** (sometimes under **Configure**).

Copy these two into your notes:

| What Clerk calls it | Starts with | You will paste it in Vercel as |
|---|---|---|
| Publishable key | `pk_test_` | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` |
| Secret key | `sk_test_` | `CLERK_SECRET_KEY` |

Leave this tab open. After Vercel gives you a web address, you will come back
and add that address under **Domains**.

---

## Step 2 — Supabase (one database address)

This is where walks and attendance are stored. We only use it as a database.
You can ignore Auth, Storage, and anything labelled `anon` or `service_role`.

1. Open [https://supabase.com/dashboard](https://supabase.com/dashboard).
2. Click **New project**.
3. Fill in:
   - **Name:** `bury-steps`
   - **Database password:** click generate, then **copy it somewhere safe**.
     You will not see it again.
   - **Region:** **West EU (London)** — pick this so the data stays in the UK.
4. Click **Create new project** and wait until it finishes (about a minute).

Now copy the connection address:

1. Click **Connect** near the top of the page.
   (If you cannot see it: the gear icon **Project Settings** → **Database** →
   **Connect**.)
2. Choose **Session pooler**. The port in the address must be **5432**.
   Do not pick 6543 or “transaction”.
3. Copy the whole URI. It is a long line starting with `postgresql://`.

Paste it into your notes as `DATABASE_URL`. It looks like this (yours will be
different):

```
postgresql://postgres.abcdefghijkl:YOUR_PASSWORD@aws-0-eu-west-2.pooler.supabase.com:5432/postgres
```

If the password contains `@`, `#`, `%`, `/` or a space, the site will fail to
talk to the database. The easiest fix is to generate a password that is only
letters and numbers, then copy the Connect URI again.

The tables (`User`, `Walk`, `Attendance`) are created automatically the first
time Vercel deploys. You do not paste SQL yourself.

---

## Step 3 — Vercel (put the site online)

Vercel builds the site from GitHub and hosts it.

1. Open [https://vercel.com](https://vercel.com) and sign in **with GitHub**.
2. Click **Add New…** → **Project**.
3. Import **bury-steps** (your fork, or `leejay123/bury-steps` if that is yours).
4. **Before you click Deploy**, open **Environment Variables**.
5. Add these four, one at a time. Names must match exactly.

| Name | Value |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | the Clerk publishable key (`pk_test_…`) |
| `CLERK_SECRET_KEY` | the Clerk secret key (`sk_test_…`) |
| `DATABASE_URL` | the Supabase Session pooler URI (`postgresql://…5432…`) |
| `CRON_SECRET` | a long random string (Vercel Cron sends this automatically) |

For each one, tick **Production**, **Preview** and **Development**.

6. Click **Deploy**. Wait until it says the deployment is ready. The first
   deploy can take a couple of minutes.

If Vercel warns that `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` looks like a secret,
that is a false alarm. Confirm it and save it anyway. It is meant to be public.

7. Click **Visit** (or open the `.vercel.app` link).

For a first go-live, a `*.vercel.app` address is enough. Clerk talks to the
app through `https://your-app.vercel.app/__clerk` — you do **not** add DNS
records on `vercel.app`. Prefer a custom domain when you want branded emails,
email-link sign-in, invitations, and custom email templates.

---

## Step 4 — Production Clerk keys

In Clerk, switch to the **Production** instance and copy the **live** keys
(`pk_live_…` and `sk_live_…`). In Vercel → **Settings** → **Environment
Variables**, set those on **Production** (keep development keys on Preview if
you want). Redeploy.

Sign-in, sign-up, verification codes, and password-reset emails on
`*.vercel.app` use Clerk’s shared `accounts.dev` mail. You cannot add DNS for
`vercel.app`.

---

## Step 5 — Create the first account

You should see **Bury Steps Walking Group** and a way to join or sign in.

**The first person to create an account becomes the organiser.** They can add
walks. Everyone after that is a normal member.

1. Click **Join the group** and create an account.
2. You should land on the walks page.
3. Open `/admin` on your site (add `/admin` to the end of your Vercel address).
4. Create a walk. Copy the share link to send to members.
5. Clock-in on that link only works from **1 hour before** the start until
   **1 hour after** the walk is due to finish. Members must be signed in —
   having the link is not enough.

---

## Make someone else an organiser

This is done in Supabase, not Clerk.

1. Open your Supabase project.
2. Click **Table Editor** in the left sidebar.
3. Open the **User** table.
4. Find the person. Change **role** from `MEMBER` to `ADMIN`.
5. Ask them to refresh the page.

If the User table is empty, nobody has signed in yet, or the first deploy did
not finish creating tables — check that the Vercel deploy succeeded.

---

## If something goes wrong

| What you see | What it usually means | What to do |
|---|---|---|
| Vercel deploy fails and mentions the database or Prisma | `DATABASE_URL` is missing, or it is the wrong pooler | In Vercel → Settings → Environment Variables, check the name is exactly `DATABASE_URL`. In Supabase, copy **Session pooler** again (port **5432**). Redeploy |
| Application error / “max clients reached” | Too many open database sessions | Keep `DATABASE_URL` on Session pooler (5432). Redeploy. The live site uses transaction pooling on its own |
| Vercel deploy fails on a Clerk key | A key was not pasted, or there is an extra space | Re-copy both Clerk keys into Vercel. No quotes around the value in the Vercel form. Redeploy |
| The site loads but sign-in does nothing | Production keys without the `/__clerk` proxy, or test keys on Production | Confirm Vercel Production has `pk_live_` / `sk_live_` keys, the app is on Clerk SDK 7+, and middleware matches `/__clerk/:path*`. Do not add DNS for `vercel.app` |
| `/admin` sends you back to walks | Your account is a member, not an organiser | In Supabase → Table Editor → User, set `role` to `ADMIN` |
| Tables are missing in Supabase | Deploy did not run, or it failed before the database step | Open the failed Vercel deployment log. Fix `DATABASE_URL`, then **Redeploy** |
| Password / authentication failed | The password inside `DATABASE_URL` is wrong | Reset the database password in Supabase, copy the Connect URI again, update Vercel, redeploy |

To redeploy without changing code: Vercel → **Deployments** → the latest one →
**⋯** → **Redeploy**.

---

## What each page does

The live site is [https://burysteps-walkinggroup.co.uk](https://burysteps-walkinggroup.co.uk).

| Page | Who it is for | What it is for |
|---|---|---|
| `https://burysteps-walkinggroup.co.uk/` | Anyone | Home |
| `https://burysteps-walkinggroup.co.uk/sign-up` | Anyone | Create an account |
| `https://burysteps-walkinggroup.co.uk/dashboard` | Signed-in members | Upcoming walks |
| `https://burysteps-walkinggroup.co.uk/admin` | Organisers only | Create walks and copy share links |
| `https://burysteps-walkinggroup.co.uk/admin/walks/…` | Organisers only | Who is coming, download a list, cancel |
| `https://burysteps-walkinggroup.co.uk/w/…` | Signed-in members | Clock in for that walk |

Times are shown in UK time (GMT in winter, BST in summer).

---

## Health notes and privacy

Clock-in can store a short health note. That is sensitive information.

- People tick an explicit consent box before it is saved.
- Notes are wiped automatically 90 days after the walk.
- Only organisers can read them.
- Choosing the **London** region in Supabase keeps the data in the UK.

You should still write a short privacy notice for your group and link it from
the clock-in page. This README is not legal advice.

---

## The three values (checklist)

Paste these in **Vercel → Project → Settings → Environment Variables**.

| Name | Where you copied it |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk → API Keys → Publishable key |
| `CLERK_SECRET_KEY` | Clerk → API Keys → Secret key |
| `DATABASE_URL` | Supabase → Connect → Session pooler (port 5432) |
| `CRON_SECRET` | Make a long random string. Vercel Cron sends it as `Authorization: Bearer` when the nightly job runs. |

Clerk, the database, and `CRON_SECRET` are required in Vercel. Without `CRON_SECRET` the nightly health-note purge will not run.
