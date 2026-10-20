# SITREP — Global Intelligence Command Center

An intelligence-agency-style command-center dashboard that aggregates global
news, conflict/protest data, geopolitics and Indian national politics onto an
interactive 3D globe — with AI regional "situation report" agents, a 7-day
rolling archive with similar-context search, a UPSC-focused mode, and a
floating AI assistant named **Stalin**.

This is an original, independent project — it does not represent, use the
name/branding of, or claim affiliation with any real intelligence agency.

## Status

Phases 1–6 complete: live deploy, responsive UI shell, political-map globe
(official Indian boundaries), real data ingestion (GDELT +
Guardian/GNews/NewsData.io + RSS), functional filters/timeline/
similar-context, 8 regional AI agents + an MCP endpoint, and the Stalin
assistant (streaming, retrieval over the 7-day database, cited answers). See
[PLAN.md](./PLAN.md) for the full architecture, data sources, database
schema, and phased build plan, and [PROMPT.md](./PROMPT.md) for the original
project brief.

## MCP endpoint

`/api/mcp` exposes this dashboard's own data to any MCP-compatible client
(e.g. Claude Desktop) over the streamable-HTTP transport — tools:
`search_events`, `get_region_summary`, `get_country_timeline`,
`get_item_by_id`. No API key needed to query it; it only reads the public
7-day event data this dashboard already shows.

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
