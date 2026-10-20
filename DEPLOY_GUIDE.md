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
2. Add the same key as a **GitHub Actions secret** only (repo **Settings → Secrets and variables → Actions → New repository secret**, name `GROQ_API_KEY`) — the agents run on a schedule via GitHub Actions and write their reports to the database; Vercel itself never calls Groq directly, so it does **not** need this secret.
3. No Vercel changes needed for this phase.

## Later phases

- **Phase 8:** generating and storing your Telegram session string as a GitHub Actions secret.

Each of those will come with its own exact numbered steps when we get there.
