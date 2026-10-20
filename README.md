# SITREP — Global Intelligence Command Center

An intelligence-agency-style command-center dashboard that aggregates global
news, conflict/protest data, geopolitics and Indian national politics onto an
interactive 3D globe — with AI regional "situation report" agents, a 7-day
rolling archive with similar-context search, a UPSC-focused mode, and a
floating AI assistant named **Stalin**.

This is an original, independent project — it does not represent, use the
name/branding of, or claim affiliation with any real intelligence agency.

## Status

Currently in **Phase 1** (project setup / first deploy). See
[PLAN.md](./PLAN.md) for the full architecture, data sources, database
schema, and phased build plan, and [PROMPT.md](./PROMPT.md) for the original
project brief.

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS, deployed on Vercel.
Background ingestion via GitHub Actions into a Neon (Postgres + pgvector)
database. See [PLAN.md](./PLAN.md) for the complete list of data sources,
the LLM/agent design, and the Telegram ingestion plan.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploying

See [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md) for a beginner-friendly, step-by-step
walkthrough of GitHub + Vercel, environment variables, and the database setup.

## Data sources

See [SOURCES.md](./SOURCES.md) (added in Phase 3) for the full list of data
sources, their type, limits and terms.
