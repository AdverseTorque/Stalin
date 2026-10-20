# DEPLOY_GUIDE — step-by-step, for a total beginner

This guide assumes you've never used GitHub or Vercel before. Follow each
numbered step in order. Sections for later phases (database, API keys,
Telegram) are added as we reach those phases — don't worry about them yet.

---

## Phase 1 — GitHub repo + first Vercel deploy

### Step 1: Create the GitHub repository

1. Go to https://github.com/new (log in with your existing GitHub account first if needed).
2. **Repository name:** `sitrep` (or any name you like — doesn't have to match).
3. **Visibility:** choose **Public** (we confirmed this earlier — it gives us unlimited free GitHub Actions minutes for the data-ingestion jobs we'll add in Phase 3).
4. **Important:** do **NOT** check "Add a README", "Add .gitignore", or "Choose a license". Leave the repo completely empty — we already have those files locally and an empty repo avoids a merge conflict on the first push.
5. Click **Create repository**.
6. On the page that appears, copy the URL shown under "…or push an existing repository from the command line" — it looks like `https://github.com/<your-username>/sitrep.git`. Send me that URL (or just tell me your GitHub username + the repo name) and I'll wire it up and push.

### Step 2: First push (I'll run this once you give me the repo URL)

I'll run `git remote add origin <url>` and `git push -u origin main`. The
**first** push will likely pop up a browser window asking you to log into
GitHub — that's Windows' built-in Git Credential Manager, it's expected and
safe. Just log in there once; it'll be remembered after that.

### Step 3: Connect Vercel

1. Go to https://vercel.com/signup and sign up using **"Continue with GitHub"** (simplest — it reuses your GitHub login, no new password to manage).
2. Authorize Vercel to access your GitHub account when prompted.
3. On the Vercel dashboard, click **Add New… → Project**.
4. Find and select the `sitrep` repository, click **Import**.
5. Vercel will auto-detect it's a Next.js project — leave all build settings on their defaults.
6. Click **Deploy**. Wait ~1–2 minutes.
7. You'll get a live URL like `sitrep-<something>.vercel.app`. Open it — you should see a dark "SITREP / SYSTEM ONLINE" placeholder page. That confirms the whole pipeline (GitHub → Vercel → live site) works.

### Step 4: Redeploying later

From Phase 2 onward, redeploying is automatic: every time I push a commit to
the `main` branch on GitHub, Vercel rebuilds and redeploys within ~1–2
minutes automatically. You don't need to do anything manually for routine
updates.

---

## Phase 3 — database + data sources

1. Created a free Neon Postgres project at console.neon.tech, copied its connection string into `DATABASE_URL` in `.env.local` (never committed, never pasted into chat).
2. Same connection string added as an environment variable in Vercel (**Settings → Environment Variables**) and as a GitHub Actions secret (**repo Settings → Secrets and variables → Actions**) — Vercel needs it to *serve* live data, GitHub Actions needs it to *write* ingested data on its schedule.
3. (Optional) free API keys for Guardian/GNews/NewsData.io, added the same way.

## Phase 5 — continent agents + MCP endpoint

1. Got a free `GROQ_API_KEY` from console.groq.com, added it to `.env.local`.
2. Add the same key as a **GitHub Actions secret** (repo **Settings → Secrets and variables → Actions → New repository secret**, name `GROQ_API_KEY`) — the agents run on a schedule via GitHub Actions and write their reports to the database.
3. (As of Phase 6, Vercel needs this key too — see below.)

## Phase 6 — Stalin assistant

Stalin answers live in the browser, so unlike the agents, the **Vercel
deployment itself now calls Groq** and needs the key too:

1. Vercel → your project → **Settings → Environment Variables → Add**.
2. Name `GROQ_API_KEY`, value = the same key from `.env.local`, environments: all.
3. **Save**, then **Deployments → latest → ⋯ → Redeploy** (env var changes only apply to new deployments).

Without it, the dashboard still works; Stalin just replies that it isn't configured.

## First run of the scheduled workflows

GitHub doesn't always start a new repository's `schedule:` triggers on its
own. Start each one once by hand:

1. Repo → **Actions** tab → **Ingest** (left sidebar) → **Run workflow** → **Run workflow**.
2. Same for **Continent Agents**.
3. Open the run; a green tick means it worked. After that the schedules (every 20 min / twice an hour) take over.

GitHub also pauses schedules after 60 days with no commits to the repo — if
the feed stops updating, check the Actions tab and re-enable the workflow.

## Phase 8 — Telegram + install as an app

### Telegram, option A: public channels (no account, easiest)

1. Repo → **Settings → Secrets and variables → Actions → New repository secret**.
2. Name `TELEGRAM_PUBLIC_CHANNELS`, value = comma-separated channel usernames (the part after `t.me/`), e.g. `channel_one,channel_two`.
3. Run **Ingest** once from the Actions tab to check it.

### Telegram, option B: the channels you're subscribed to

The session string this creates is **full access to your Telegram
account**. It is printed only in your own terminal and saved nowhere — keep
it that way: never paste it into a chat, a file in this repo, or `.env.local`.

1. Go to my.telegram.org → **API development tools**, create an app, note the **api_id** and **api_hash**.
2. In your own terminal, in the project folder: `npm run telegram:login`. Enter the api_id, api_hash, your phone number, the login code Telegram sends you and (if set) your 2-step password. It lists your broadcast channels, then prints the session string.
3. Add these GitHub Actions secrets (same place as above):
   - `TELEGRAM_API_ID`, `TELEGRAM_API_HASH` — from step 1.
   - `TELEGRAM_SESSION` — copy it from your terminal straight into the secret box.
   - `TELEGRAM_CHANNELS` (optional) — `all`, or comma-separated usernames/ids from the list in step 2.
4. Run **Ingest** once from the Actions tab. The log shows only counts, never channel names.

To revoke access at any time: Telegram → **Settings → Devices** → end the session.

Only broadcast channels are read (never private chats or groups), but
items appear on the public dashboard with the channel's title as their
source — only include channels you're comfortable showing.

### Install SITREP on your phone

- **Android (Chrome):** open the site → ⋮ menu → **Add to Home screen / Install app**.
- **iPhone (Safari):** open the site → Share → **Add to Home Screen**.

It then opens full-screen like an app, with its own icon.
