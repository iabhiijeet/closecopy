# closecopy

A source-grounded research and study workspace. Add your own material, ask questions and get answers grounded in it with inline citations, then turn those sources into learning artifacts.

The app has a marketing homepage with an interactive demo (`/`) and the real authenticated application (`/login`, `/register`, `/workspaces`).

## Features

- **Workspaces** — each user gets private workspaces with their own sources, conversations and artifacts.
- **Sources** — paste text or Markdown, upload PDFs, or import websites (Firecrawl) and YouTube transcripts. Sources are chunked and embedded into Pinecone for retrieval.
- **Cited chat** — streaming AI answers over Pinecone-retrieved passages with numbered citations, saved conversation history, optional web search (Tavily), rolling conversation summaries and user memories (Mem0).
- **Learning artifacts** — generate summaries, key takeaways, flashcards, quizzes, mind maps and reports from selected sources. Rendering and Markdown export are available in the UI.
- **Auth** — email/password and Google sign-in via Better Auth with cookie sessions.
- **Local-first demo** — the homepage playground is a visual demo that uses bundled sample data and makes no API calls.

## Architecture

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, Base UI/shadcn, TanStack Query, Zustand |
| API | Express 5, Better Auth, Zod validation |
| Data | PostgreSQL via Prisma 7, Pinecone vectors |
| Background jobs | Inngest (source processing, artifact generation, conversation summaries) |
| Integrations | OpenAI (chat + embeddings), Cloudinary (PDF storage), Firecrawl, Tavily, Mem0 |

Data flow: the frontend calls the Express API; sources are processed asynchronously by Inngest into chunks and vectors; chat queries retrieve relevant chunks from Pinecone and stream an AI SDK message stream back to the client; artifacts are generated as background jobs and stored as structured JSON in Postgres.

## Repository layout

```
closecopy/
├── client/   # Next.js frontend (app router, landing page, workspace UI, browser tests)
├── server/   # Express API, Prisma schema/migrations, Inngest functions, services
└── vercel.json  # Vercel build config for the client
```

Detailed frontend notes are in [`client/README.md`](client/README.md).

## Prerequisites

- Node.js 20.9+ and npm.
- PostgreSQL database (e.g. Neon). Use the **direct/unpooled** connection string; the Neon pooler enforces an empty `search_path` that breaks unqualified queries.
- Pinecone index with `1536` dimensions and cosine similarity.
- API keys for OpenAI, Cloudinary, and — depending on the features you want — Firecrawl, Tavily, and Mem0.
- Inngest event/signing keys for cloud jobs, or the Inngest dev server for local jobs.

## Local development

1. Install dependencies:

   ```bash
   (cd server && npm install)
   (cd client && npm install)
   ```

2. Create environment files from the examples and fill in your values:

   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env.local
   ```

   Important server values:

   - `DATABASE_URL` — direct Postgres connection string.
   - `BETTER_AUTH_SECRET` — generate with `openssl rand -base64 32`; `BETTER_AUTH_URL` is the API origin (default `http://localhost:8080`).
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — only needed for Google sign-in.
   - `CLIENT_URL` — frontend origin allowed by CORS (default `http://localhost:3000`).
   - `PINECONE_API_KEY`, `PINECONE_INDEX`, and cloud/region settings; the index must match the embedding dimensions.
   - `INNGEST_EVENT_KEY` / `INNGEST_SIGNING_KEY` — cloud jobs. For local jobs, set `INNGEST_DEV=1` instead.
   - `MEM0_API_KEY` is optional; memory endpoints return empty data without it.

3. Apply the database schema:

   ```bash
   cd server
   npx prisma migrate deploy
   npm run prisma:generate
   ```

4. Start the services in separate terminals:

   ```bash
   # API — http://localhost:8080
   cd server && npm run dev

   # Background jobs — only when using INNGEST_DEV=1
   cd server && npm run dev:jobs

   # Frontend — http://localhost:3000
   cd client && npm run dev
   ```

   With Inngest cloud keys configured, no local job server is needed. If neither cloud keys nor the local worker are available, source and artifact processing requests fail with a prompt error and the UI offers retry controls.

## Useful scripts

Server (`cd server`):

| Script | Purpose |
| --- | --- |
| `npm run dev` | Run the API with watch mode |
| `npm run dev:jobs` | Run the Inngest dev server against `/api/inngest` |
| `npm run prisma:generate` | Generate the Prisma client |
| `npm run build` / `npm start` | Compile and run the API |
| `npm run typecheck` | TypeScript check |
| `npm run test:processors` | Test extraction, embedding, retrieval and artifact processing (`-- --vectors-only` for retrieval only) |

Client (`cd client`):

| Script | Purpose |
| --- | --- |
| `npm run dev` / `npm run build` / `npm start` | Develop, build, and serve the frontend |
| `npm run lint` | ESLint |
| `npm run test:smoke` | Browser smoke check (requires Playwright Chromium) |
| `npm run test:auth-workspace` | Auth/workspace smoke check against running servers |
| `npm run test:frontend` | UI checks with synthetic API fixtures |
| `npm run test:e2e` | Live frontend/backend flow using temporary test accounts |

## API overview

All `/api/workspaces/*` and `/api/memories/*` routes require a Better Auth session. Nested workspace routes are scoped to the authenticated user.

| Base path | Endpoints |
| --- | --- |
| `/api/auth/*` | Better Auth handlers (email/password, Google, sessions) |
| `/api/workspaces` | List, create, get, patch, delete workspaces |
| `/api/workspaces/:workspaceId/sources` | List, create (text/Markdown), upload PDF, import website/YouTube, get, delete, bulk delete, reprocess |
| `/api/workspaces/:workspaceId/chat` | `POST` streams an AI message (UI message stream) and returns `X-Conversation-Id` |
| `/api/workspaces/:workspaceId/conversations` | List, create, delete conversations; get messages |
| `/api/workspaces/:workspaceId/artifacts` | List, create, get, delete learning artifacts |
| `/api/memories` | List, create, update, delete user memories |
| `/api/inngest` | Inngest serve endpoint for the three background functions |

Background functions: `source/created` (extract → chunk → embed/index), `artifact/generate`, and `conversation/summarize`.

## Production and deployment

`vercel.json` builds and serves the Next.js client from `client/`. Deploy the Express API separately and point the frontend at it with `NEXT_PUBLIC_API_URL`. Set `CLIENT_URL`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_SITE_URL`, and the server secrets in the respective deployment environments; keep CORS credentials enabled and register the deployed `/api/inngest` endpoint with Inngest.

Run `npm run build` in `server` and `npm run build` in `client` to verify both packages compile.
