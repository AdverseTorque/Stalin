# PROJECT BRIEF: Global Intelligence Command Center

You are a senior full-stack engineer, data engineer and UI designer working with me on this project from scratch. Read this entire brief before writing any code.

## 0. About me (important — read first)
- I am a geopolitics / Indian polity analyst and a UPSC CSE aspirant. I cannot keep up with the volume of news, so this tool must filter, summarise and organise it for me.
- I have a GitHub account. The app will be deployed on Vercel.
- **I have never used GitHub or Vercel for a real project before.** Guide me step by step. Whenever I have to do something manually (create an account, get an API key, click something in a dashboard, run a command), stop and tell me exactly what to do, in simple numbered steps, and wait for me to confirm.
- Explain briefly what you are doing and why at each phase. Assume I am smart but new to web deployment.

## 1. What I want
A **command-center style intelligence dashboard** — the look and feel of an intelligence agency operations room (dark theme, live feeds, glowing globe, threat/priority levels, monospace data readouts, alert tickers). Use an original name and original branding; do NOT use any real agency's name, logo or seal.

Core features:

### 1.1 Global Map (centerpiece)
- Interactive 3D globe built with **Three.js** (via `@react-three/fiber` + `@react-three/drei`, or `react-globe.gl` if better — your call, justify it).
- Events plotted as markers/heat points by location, colour-coded by category:
  - Protests / civil unrest
  - Armed conflict / fighting / terrorism
  - Global economics (markets, trade, sanctions, central banks, commodities)
  - Geopolitics / diplomacy (summits, treaties, elections abroad, military moves)
  - Indian national politics & governance (Parliament, policy, Supreme Court, states)
- Click a marker → side panel with headline, short summary, source links, time, category, severity.
- **India view (special):** clicking on India must open a choice between two modes, and the user can switch between them anytime:
  - **National** — zooms into India with state-level detail: national politics, Parliament, Supreme Court/High Courts, governance and policy, internal security, protests, state elections, economy (RBI, budget, markets), PIB/MEA releases.
  - **International** — India's external affairs: bilateral and multilateral relations, India's role in global events, neighbourhood (Pakistan, China, Bangladesh, Nepal, Sri Lanka, Myanmar, Afghanistan, Maldives, Bhutan), foreign trade, defence deals, diaspora, and how world events affect India (arcs/lines on the globe from India to the countries involved).
  - Each mode has its own feed, filters, agent report and UPSC tags. Make this mode switch clear and easy on both mobile and desktop.
- Filters: category, continent/country, time window (last 1h / 24h / 3 days / 7 days), severity, source.
- On weak/mobile devices, offer a lighter **2D map fallback** (e.g. MapLibre GL) with a toggle, and auto-select it if WebGL performance is poor.

### 1.2 Data sources (use as many good ones as are free/legal)
**Goal: maximum coverage.** Pull from every news source, API and RSS feed that legally allows it — Indian and international, mainstream and regional, government and wire-style sources. Telegram is only one supplementary source; the main data must come from news sites, APIs and feeds. Build the ingestion as a plug-in system so new sources can be added by adding one config entry or one small adapter file. Keep a `SOURCES.md` listing every source, its type, limits and terms.
Research and **verify the current terms, rate limits and free-tier rules of each source yourself (search the web / read the docs) before choosing** — do not rely on memory. Prefer sources that allow use on a deployed public site. Candidates to evaluate:
- **GDELT** (events + geo-coded news, free, frequent updates) — likely the backbone for map events.
- **ACLED** (conflict & protest data; check access/registration rules).
- News APIs: The Guardian Open Platform, GNews, NewsData.io, NewsAPI (check whether its free tier works in production).
- **RSS feeds**: BBC World, Al Jazeera, The Hindu, Indian Express, PIB (Press Information Bureau), MEA India press releases, UN News, Reuters/AP alternatives if RSS exists.
- Economic data: e.g. free market/forex/commodity endpoints, World Bank, IMF, RBI where feasible.
- **Telegram**: I will give you access to **my personal Telegram account** (so treat the session as highly sensitive) via the official MTProto API (api_id/api_hash from my.telegram.org, using GramJS or Telethon). Requirements:
  - Guide me step by step to get api_id/api_hash and generate a session string locally on my machine (never inside the deployed app or in logs).
  - Store the session string only as an encrypted secret (e.g. GitHub Actions secret / Vercel env var). Never commit it, print it or send it anywhere else.
  - Write a small script that lists all channels/groups this account has joined, so I can pick which ones to ingest. Save my selection in one config file; also support an "ingest all joined channels" mode so new channels I join are picked up automatically.
  - Read **channels only** — never read or store private chats, contacts or personal messages.
  - Run Telegram ingestion in the background job (GitHub Actions or similar), not in Vercel serverless functions, since it needs a persistent client connection. Respect Telegram rate limits (FloodWait) to avoid getting the account restricted.
  - Fallback: if API login is not feasible, use public `t.me/s/<channel>` web previews for public channels.
- Store only headlines, short summaries, metadata and links — never republish full article text.

Every item must keep: title, summary, source name, original URL, published time, location (lat/lng + country + continent), category, severity score, tags.

### 1.3 Continent Agents
- One AI agent per region: **Asia, South Asia/India (separate, since it is my priority), Europe, Middle East & North Africa, Sub-Saharan Africa, North America, Latin America, Oceania.**
- Each agent: reads its region's incoming items, de-duplicates, clusters related stories, writes a short **"situation report"** (what happened, why it matters, what to watch), and flags high-severity items as **NEWS FLASH** alerts.
- Implement each agent as a tool-using LLM agent. Design the tools in an **MCP-compatible way** (search_events, get_region_summary, get_country_timeline, get_item_by_id, etc.), and also expose them as an **MCP server endpoint** in the app (e.g. `/api/mcp`) so I can later connect this data to Claude Desktop or other MCP clients. Explain to me what this means in simple words.
- LLM provider: make it pluggable. Default to **Groq** (free tier, fast). **I already have a Groq API key** — when you need it, ask me to add it myself to `.env.local` as `GROQ_API_KEY` (and later to Vercel/GitHub secrets). Never ask me to paste it in chat, never hardcode it, never print or log it. Pick suitable current Groq models (verify the available model list from Groq's docs) and keep usage within free-tier rate limits, with an option to switch to Anthropic Claude or others via env variables. Keep token usage low (summarise in batches, cache results).

### 1.4 News Flash
- A live, scrolling breaking-news ticker plus a priority alert feed. High-severity items pulse on the globe and appear as toasts.
- Optional browser push notifications for flash items (ask me before enabling).

### 1.5 7-Day Archive + Similar Context
- Keep a rolling **7-day history** in a database (auto-delete older items).
- "Related / similar context" for any item: find similar stories from the past 7 days (use embeddings + vector search, e.g. Postgres with pgvector, or keyword/tag matching if embeddings are too costly — recommend the best free option).
- Timeline view per country/topic for the last 7 days.

### 1.6 UPSC Mode
- Tag every item with relevant **UPSC syllabus areas**: GS-1 (society, geography), GS-2 (polity, governance, international relations), GS-3 (economy, security, environment, S&T), GS-4 where relevant, and Prelims-relevant facts.
- Daily auto-generated **"UPSC Digest"**: top stories, why they matter for the exam, key facts, possible Mains questions, related static topics.
- Ability to save/bookmark items into personal notes, exportable as PDF/Markdown.

### 1.7 Floating AI Assistant — "Stalin"
- A floating chat button (bottom-right on desktop, accessible but not blocking content on mobile) that opens a chat panel.
- The assistant's name is **Stalin**. Give it a sharp, analytical, concise personality — but its answers must stay factual, balanced and neutral, presenting multiple perspectives on contested issues.
- It answers using the app's own data (retrieval over the 7-day database + agent reports), **cites sources with links**, and clearly says when it doesn't know.
- Features: "Explain this event", "Give me background", "Compare with last week", "Make UPSC notes", "Frame a Mains answer", "What should I watch tomorrow".
- Streaming responses. Context-aware: if I open it while viewing an event, it knows which event.

## 2. UI / UX requirements (very important)
- **Fully responsive and clean on phone, tablet, laptop and large monitors.** No cluttered, overlapping or messy layouts ("khichdi" — avoid it).
- Desktop: multi-panel layout (globe center, feeds on sides, ticker on top/bottom).
- Mobile: globe/map on top or full-screen, with a **bottom navigation bar** (Map / Feed / Agents / UPSC / Stalin) and panels opening as bottom sheets. No horizontal scrolling. Touch-friendly sizes.
- Dark command-center aesthetic: deep navy/black background, accent colours per category, subtle glow, grid lines, monospace for data, readable sans-serif for text. Good contrast and accessibility.
- Smooth but performance-safe animations. Respect `prefers-reduced-motion`.
- Loading skeletons, empty states and error states everywhere. The app must never show a blank or broken screen if one source fails.
- Installable as a **PWA** on my phone if feasible.

## 3. Tech stack (suggested — improve if you have a better reason)
- **Next.js (App Router) + React + TypeScript** — best fit for Vercel.
- Tailwind CSS + shadcn/ui (or similar) for UI components; Framer Motion for animation.
- Three.js via React Three Fiber for the globe; MapLibre GL for 2D fallback.
- Database: a free hosted Postgres (Supabase or Neon) with pgvector, or another free option — recommend one and explain.
- Background data ingestion: Vercel's free cron may be too limited for frequent updates. Evaluate **GitHub Actions scheduled workflows** (e.g. every 15–30 min) or another free scheduler to run ingestion jobs that write to the database. Check current limits and pick the most reliable free setup.
- State/data fetching: TanStack Query or SWR.
- All secrets in environment variables. Provide `.env.example`. **Never commit real keys.** Add proper `.gitignore`.

## 4. How you should work
1. **First, do NOT code.** Research the data sources and constraints, then give me a written plan: architecture diagram (text/mermaid), data flow, folder structure, chosen APIs with their limits, database schema, cost (target: ₹0 / free tiers), and risks. Ask me any questions you need answered. Wait for my approval.
2. Build in **phases**, each one working and demoable before the next:
   - Phase 1: Project setup, GitHub repo, first Vercel deploy of a basic page (teach me GitHub + Vercel here).
   - Phase 2: UI shell — responsive layout, theme, navigation, globe with mock data.
   - Phase 3: Data ingestion pipeline + database + real events on the map.
   - Phase 4: Feeds, filters, news flash, 7-day archive and timelines.
   - Phase 5: Continent agents + MCP endpoint.
   - Phase 6: Stalin assistant.
   - Phase 7: UPSC mode, digest, notes export.
   - Phase 8: Telegram integration, PWA, performance polish, testing on mobile viewport.
3. After every phase: run the app, check for errors (build + lint + type-check), test mobile and desktop viewports, commit with a clear message, and tell me what to verify.
4. Write a **`DEPLOY_GUIDE.md`** for a total beginner: creating the GitHub repo, pushing code, connecting to Vercel, adding environment variables, setting up the database, getting each API key, and how to redeploy. Also a short **`README.md`**.
5. If something I asked for is not possible for free or legally (e.g. an API forbids it), tell me clearly and propose the best alternative instead of silently skipping it.
6. Keep the code clean, typed, modular and commented where non-obvious, so I can maintain it later.

Start now with Step 1 (research + plan + questions).
