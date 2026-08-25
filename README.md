# Bury Steps Walking Group

A website for a walking group. Members create an account, organisers add walks,
and people clock in when they arrive.

You do **not** need to be a programmer to follow this. You will click through a
few websites, copy and paste three secret values, and run a handful of commands.

When you are done, the app runs on your computer at [http://localhost:3000](http://localhost:3000).

---

## What you are setting up (in plain English)

The app is already written. You are plugging in two services it needs:

1. **Clerk** — the login box (sign up, sign in, “forgot password”).
2. **Supabase** — the filing cabinet (who is in the group, which walks exist,
   who clocked in).

You will copy **three values** into a file called `.env`:

- two keys from Clerk
- one database address from Supabase

That is the whole setup.

---

## Before you start

### 1. Install Node.js

Node.js is the program that runs this website on your computer.

1. Open [https://nodejs.org](https://nodejs.org).
2. Download the **LTS** version (the button that says “Recommended”).
3. Install it. Click Next until it finishes.
4. **Quit and reopen** Terminal (Mac) or Command Prompt (Windows).

Check it worked. Type this and press Enter:

```bash
node -v
```

You should see something like `v20.11.0` or `v22.4.0`. If you see “command not
found”, Node is not installed yet — reopen the terminal after installing.

### 2. Create two free accounts

Open these in your browser and sign up (Google or GitHub login is fine):

| Website | What it is for | Link |
|---|---|---|
| Clerk | Member login | [https://dashboard.clerk.com](https://dashboard.clerk.com) |
| Supabase | Database | [https://supabase.com/dashboard](https://supabase.com/dashboard) |

Keep both tabs open. You will come back to them.

---

## Step 1 — Put the project on your computer

Open **Terminal** (Mac: search “Terminal” in Spotlight) or **Command Prompt**
(Windows).

Copy each block below, paste it, press Enter, and wait until it finishes before
the next one.

```bash
git clone https://github.com/leejay123/bury-steps.git
```

That downloads the project.

```bash
cd bury-steps
```

That moves you into the project folder. Your prompt should now end with
`bury-steps`.

```bash
npm install
```

That installs the extra pieces the app needs. It can take a minute. Warnings
in yellow are usually fine. Red errors are not.

```bash
cp .env.example .env
```

That makes a private settings file. You will paste your three keys into it
next. **Never share `.env` or put it on GitHub** — it holds secrets.

---

## Step 2 — Get the two Clerk keys

Clerk is the login system.

1. Go to [https://dashboard.clerk.com](https://dashboard.clerk.com).
2. Click **Create application**.
3. Name it `Bury Steps`.
4. Tick **Email**. You can also tick **Google** so people can sign in with a
   Google account. Then create the application.
5. On the next screen you should see **API keys**. If not, look in the left
   sidebar for **API Keys** (sometimes under **Configure**).

You will see two keys:

| Name on the page | Starts with | Paste it next to this line in `.env` |
|---|---|---|
| Publishable key | `pk_test_` | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=` |
| Secret key | `sk_test_` | `CLERK_SECRET_KEY=` |

Open the `.env` file in any text editor (on a Mac you can run `open -e .env`).
Replace the placeholder text. Keep the quote marks.

It should look like this (your keys will be longer and different):

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_abc123..."
CLERK_SECRET_KEY="sk_test_xyz789..."
```

Leave the `DATABASE_URL` line for the next step.

---

## Step 3 — Get the Supabase database address

Supabase is where walks and attendance are stored. We only use it as a
database. You can ignore anything labelled Auth, Storage, or `anon` key.

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard).
2. Click **New project**.
3. Fill in:
   - **Name:** `bury-steps`
   - **Database password:** click generate, then **copy it somewhere safe**.
     You will not see it again.
   - **Region:** **West EU (London)**. Pick this so the data stays in the UK.
4. Click **Create new project** and wait until the spinning icon stops
   (about a minute).

Now copy the connection address:

1. Click **Connect** near the top of the project page.
   (If you cannot see it: **Project Settings** → **Database** → **Connect**.)
2. Find **Session pooler**. The port number in the address must be **5432**.
   Do not pick the one that says 6543 or “transaction”.
3. Copy the whole URI. It is a long line starting with `postgresql://`.
4. Paste it into `.env` on the `DATABASE_URL=` line, inside the quotes.

Example (yours will have a different project name and password):

```
DATABASE_URL="postgresql://postgres.abcdefghijkl:YOUR_PASSWORD@aws-0-eu-west-2.pooler.supabase.com:5432/postgres"
```

**If the password has** `@`, `#`, `%`, `/` **or a space**, the address will
fail until those characters are encoded. The easiest fix is to generate a
password that is only letters and numbers.

Save the `.env` file.

Your finished `.env` has exactly three filled-in lines:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
DATABASE_URL="postgresql://postgres....:....@....pooler.supabase.com:5432/postgres"
```

---

## Step 4 — Create the tables and start the app

Back in Terminal, still inside the `bury-steps` folder:

```bash
npx prisma migrate deploy
```

This creates three tables in Supabase (`User`, `Walk`, `Attendance`). You
should see a success message, not a long hang or a red error.

Then start the website:

```bash
npm run dev
```

Leave this running. Open your browser and go to:

[http://localhost:3000](http://localhost:3000)

You should see **Bury Steps Walking Group** and buttons to join or sign in.

### First person to sign up is the organiser

Click **Join the group** and create an account.

**Whoever signs up first becomes the organiser.** They can create walks.
Everyone after that is a normal member.

Try it:

1. After signing up you should land on the walks page (`/dashboard`).
2. Open [http://localhost:3000/admin](http://localhost:3000/admin).
3. Create a walk (pick a time about 30 minutes from now so you can test
   clock-in).
4. Copy the share link and open it while signed in. Clock-in only works from
   **1 hour before** the start until **1 hour after** the walk is due to finish.

To stop the app later, go back to Terminal and press `Ctrl+C`.

---

## If something goes wrong

| What you see | What it usually means | What to do |
|---|---|---|
| Clerk talks about a missing publishable key | `.env` was not saved, or you edited `.env.example` by mistake | Make sure you are editing `.env`, the `pk_test_` value is real, then stop the app (`Ctrl+C`) and run `npm run dev` again |
| `P1001`, timeout, or migrate never finishes | Wrong database address | In Supabase, copy **Session pooler** again. The port must be **5432**, not 6543 |
| Password / authentication failed | The password in the URL does not match | Reset the database password in Supabase, put the new one into `DATABASE_URL`, save, try migrate again |
| `localhost:3000` will not load | The app is not running | In the `bury-steps` folder, run `npm run dev` and wait until it says “Ready” |
| You signed up first but cannot open `/admin` | Someone else already created an account | See “Make someone an organiser” below |
| Tables are missing in Supabase | Step 4 did not run | Run `npx prisma migrate deploy` again |

---

## Make someone an organiser

Organiser status is stored in the database, not in Clerk.

**Easiest way:**

1. Open your Supabase project.
2. Click **Table Editor** in the left sidebar.
3. Click the **User** table.
4. Find the person. Change **role** from `MEMBER` to `ADMIN`.
5. Save.

They may need to refresh the page.

---

## Put the site on the internet (optional)

Do this when the app already works on your computer.

1. Create a free account at [https://vercel.com](https://vercel.com) (sign in
   with GitHub).
2. In Terminal:

   ```bash
   npx vercel
   ```

   Follow the questions. Accept the defaults if you are unsure.
3. When it asks about environment variables, add the **same three** from `.env`.
   You can also add them later: Vercel project → **Settings** →
   **Environment Variables**. Tick Production, Preview and Development.
4. Redeploy after saving the variables.
5. In Clerk, open **Domains** and add the Vercel web address
   (something like `https://bury-steps.vercel.app`).

Share links are built from your Vercel address automatically. You do not need
an extra URL variable unless you later buy a custom domain and the copied
links look wrong.

---

## What each page does

| Address | Who can use it | What it is for |
|---|---|---|
| `/` | Anyone | Home page |
| `/sign-up` and `/sign-in` | Anyone | Create an account / log in |
| `/dashboard` | Signed-in members | Upcoming walks and your clock-ins |
| `/admin` | Organisers only | Create walks and copy share links |
| `/admin/walks/...` | Organisers only | Who is coming, download a list, cancel |
| `/w/...` | Signed-in members | Clock in for that walk |

The share link is not a secret password. People still have to be signed in.

Times are shown in UK time (GMT in winter, BST in summer).

---

## Health notes and privacy

Clock-in can store a short health note. That is sensitive information.

- People tick an explicit consent box before it is saved.
- Notes are wiped 90 days after the walk.
- Only organisers can read them.
- Choosing the **London** region in Supabase keeps the data in the UK.

You should still write a short privacy notice for your group and link it from
the clock-in page. This README is not legal advice.

---

## Commands you will use again

Run these from inside the `bury-steps` folder.

| Command | What it does |
|---|---|
| `npm run dev` | Start the app on your computer |
| `npx prisma migrate deploy` | Create / update database tables |
| `npm run db:studio` | Open a simple window to view the data |

---

## Need help?

Check the “If something goes wrong” table first. The three values in `.env`
are the cause of almost every first-time problem — a missing quote, a
placeholder that was never replaced, or the 6543 pooler instead of 5432.
