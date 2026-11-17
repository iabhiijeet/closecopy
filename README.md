# closecopy

**From sources to something remarkable.**

[Live demo](https://notebooklm-clone-wbot2pofva-uc.a.run.app/) — hosted on Cloud Run.

closecopy is a source-grounded research workspace. Add your own sources, ask cited questions, and turn what you read into useful learning artifacts — summaries, study guides, quizzes, flashcards, mind maps, timelines, reports, and slides. It is a NotebookLM-style application built as a full-stack TypeScript project.

## What it does

- **Accounts and workspaces** — email/password and Google sign-in via Better Auth cookie sessions; searchable workspace library with create, rename, and delete.
- **Source imports** — upload PDFs, paste text or Markdown, import websites (Firecrawl), and pull YouTube transcripts. Sources are extracted, chunked, embedded, and indexed in Pinecone by background jobs.
- **Cited chat** — streamed answers grounded in the selected sources with clickable citation excerpts, saved conversations, stop/regenerate controls, Markdown rendering, and conversation summarization (Mem0).
- **Studio artifacts** — generate summaries, key takeaways, flashcards, quizzes, mind maps, and reports from selected sources. Artifacts are interactive (flippable cards, retryable quizzes, draggable mind-map nodes) and downloadable as Markdown.
- **Landing page** — a separate, animated visual demo of the product with a simulated playground; it uses bundled sample data and makes no API calls.

## Tech stack

| Layer | Technologies |
| --- | --- |
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Base UI / shadcn, TanStack Query, Zustand, Lucide, Sonner, Framer Motion, Recharts, next-themes |
| Backend | Express 5, Better Auth, Prisma 7, PostgreSQL (Neon), Zod |
| AI & data | OpenAI / AI SDK, Pinecone, Mem0, Firecrawl, Tavily, unpdf, youtube-transcript |
| Jobs & storage | Inngest, Cloudinary, Multer |
| Tooling | ESLint, TypeScript, Playwright (smoke / UI / E2E checks) |

## Project structure

```
closecopy/
├── client/                 # Next.js frontend
│   ├── app/                # Routes: landing page, /login, /register, /workspaces
│   ├── components/         # landing, sections, workspace, artifacts, auth, ui
│   ├── lib/                # API client, auth helpers, mock data, export utils
│   ├── scripts/            # smoke, UI and end-to-end checks
│   └── README.md           # detailed frontend notes
├── server/                 # Express API
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── routes/         # /api/workspaces, /api/memories, auth, Inngest
│   │   ├── services/       # Workspace, source, chat, artifact, memory logic
│   │   ├── repository/     # Prisma data access
│   │   ├── inngest/        # Background functions: source processing, artifact generation, summarization
│   │   ├── lib/            # DB, auth, AI, Pinecone, Cloudinary, extraction integrations
│   │   └── middleware/     # Auth, errors, uploads
│   └── prisma/             # Schema and migrations
└── vercel.json             # Frontend deployment config
```

## Getting started

Prerequisites: Node.js 20.9+ and npm. You will also need a PostgreSQL database (Neon works well), an OpenAI key, and credentials for the source-import integrations you plan to use.

### 1. Install dependencies

```powershell
cd client
npm install
cd ../server
npm install
```

### 2. Configure environment variables

```powershell
copy client\.env.example client\.env.local
copy server\.env.example server\.env
```

Set at minimum, in `server/.env`:

- `DATABASE_URL` — Postgres connection string (use the direct/unpooled host for Neon)
- `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`
- `CLIENT_URL=http://localhost:3000`
- `OPENAI_API_KEY`
- `PINECONE_API_KEY`, `PINECONE_INDEX`, `PINECONE_CLOUD`, `PINECONE_REGION`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `FIRECRAWL_API_KEY`, `TAVILY_API_KEY`
- Google `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` for Google sign-in
- Inngest keys, or `INNGEST_DEV=1` for local jobs

`client/.env.local` only needs `NEXT_PUBLIC_API_URL` (default `http://localhost:8080`).

Then prepare the database:

```powershell
cd server
npx prisma migrate deploy
npm run prisma:generate
```

### 3. Run the app

In three separate terminals:

```powershell
# Terminal 1 — API
cd server
npm run dev

# Terminal 2 — background jobs (requires INNGEST_DEV=1 in server/.env)
cd server
npm run dev:jobs

# Terminal 3 — frontend
cd client
npm run dev
```

Open `http://localhost:3000`. The homepage is the visual demo; sign in and visit `/workspaces` to use the live API-backed application. The backend listens on port 8080 and the local Inngest dev server on 8288.

## Checks

```powershell
# Frontend
cd client
npx tsc --noEmit
npm run lint
npm run build
npm run test:auth-workspace   # needs frontend + backend running
npm run test:frontend         # UI checks with synthetic fixtures
npm run test:e2e              # live flow; creates and removes temp accounts

# Backend
cd server
npm run typecheck
npm run test:processors       # extraction / embedding / retrieval checks
```

See [`client/README.md`](client/README.md) for frontend-specific details, theme tokens, state management, and interaction notes.

## Deployment

The frontend includes a root-level `vercel.json` that builds `client/` and serves `client/.next`. The backend is deployed separately as an API service; configure `CLIENT_URL` and `BETTER_AUTH_URL` for the production origins and use cloud Inngest keys so background jobs run in production. A hosted instance is available at the [live demo link](https://notebooklm-clone-wbot2pofva-uc.a.run.app/).
