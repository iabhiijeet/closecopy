# closecopy

A source-grounded research workspace with login, registration, source imports, cited chat and learning artifacts. Built with Next.js 16, TypeScript, Tailwind CSS 4, Base UI-based shadcn components, TanStack Query, Zustand, Lucide and Sonner.

## Install and run

```powershell
cd client
npm install
npm run dev
```

Visit http://localhost:3000. Geist and Newsreader are loaded through `next/font`. Node 20.9+ is required by the existing Next.js version.

For account and workspace pages, start the backend on `http://localhost:8080` and set `NEXT_PUBLIC_API_URL` in `client/.env.local` if it runs elsewhere. `client/.env.example` shows the default. The backend must allow the frontend origin through `CLIENT_URL`. Email/password and Google sign-in use the backend's Better Auth cookie session. Google sign-in also needs the Google credentials configured in `server/.env`.

`/login` and `/register` provide account access. `/workspaces` is a searchable library with a creation dialog. `/workspaces/[workspaceId]` has Sources, Chat, and Studio panels: users can add text, website, YouTube and PDF sources, switch conversations, ask cited questions, generate artifacts, and open them in readable views. Server data is cached in TanStack Query; the active mobile workspace panel uses Zustand. The homepage playground remains a separate visual demo.

Start the backend with `npm run dev` in `server`. In a separate terminal, run `npm run dev:jobs` in `server` for source processing and artifact generation, with `INNGEST_DEV=1` in `server/.env`. This uses the [official Inngest development server](https://www.inngest.com/docs/local-development). If the local worker is unavailable, the API returns a prompt processing error and the frontend offers retry controls.

Workspaces support editing and deletion. Sources can be previewed, removed, retried and selected for Studio generation. Chat supports saved conversations, stopping a response, Markdown formatting, copying replies and opening citation passages. Artifacts include interactive quizzes, flashcards, connected mind maps and Markdown downloads.

## Theme variables

Theme variables live in `app/globals.css`. Dark mode is the default; the navigation toggle switches themes and remembers the choice. Components use semantic color tokens.

| Role               | Light     | Dark      |
| ------------------ | --------- | --------- |
| Background         | `#FAF8F4` | `#0C1110` |
| Cards              | `#FFFFFF` | `#131A18` |
| Border             | `#E6E1D8` | `#24302D` |
| Text               | `#1A1F1D` | `#EDEAE3` |
| Muted text         | `#6B7370` | `#9AA5A0` |
| Emerald            | `#0F5C4D` | `#3FB59A` |
| Gold               | `#C8A15A` | `#D9B572` |
| Citation highlight | `#FFF1C2` | `#3A3420` |

The homepage uses still section layouts and subtle interaction motion. The hero workspace starts paused and can be played on demand. Reduced-motion settings also suppress remaining transitions and animations.

## Structure

- `app/page.tsx`: composes all twelve sections in order.
- `app/layout.tsx`: metadata, shared providers, theme control, and Toaster.
- `components/sections/`: Navbar, Hero, Marquee, Features, ArtifactsShowcase, HowItWorks, Playground, Testimonials, Pricing, FAQ, CTA, Footer.
- `components/artifacts/`: reusable SummaryArtifact, StudyGuideArtifact, QuizArtifact, FlashcardArtifact, MindMapArtifact, TimelineArtifact, ReportArtifact, SlidesArtifact, and ArtifactRenderer.
- `components/landing/`: homepage visual helpers and interactions.
- `components/ui/`: existing shadcn components plus the officially generated sonner wrapper.
- `lib/mock-data.ts`: typed sources, excerpts, chat scripts, artifact content, pricing, FAQ, and sample testimonials.
- `lib/artifact-export.ts`: local Markdown serialization and download.
- `types/index.ts`: Source, Citation, ArtifactType, Artifact, ChatMessage, QuizQuestion.

## State management

TanStack Query is available throughout the app through `components/landing/Providers.tsx`. `lib/get-query-client.ts` creates a fresh Query Client for each server render and reuses one in the browser, with a 60-second default stale time. Workspace API data and mutations use this cache; session expiry redirects to sign-in and authentication clears account-specific cached data.

Zustand is installed for shared client UI state. `stores/use-workspace-ui-store.ts` provides a typed workspace panel selection as a starting store; import its hook in client components and select only the state or action needed. Keep fetched workspace, source, and artifact data in TanStack Query rather than duplicating it in Zustand. The landing demo still uses its local sample state and makes no API calls.

## Try the interactions

- Play or pause the hero’s three-panel workspace preview.
- Switch between light and dark mode from the navigation bar.
- Click or focus citation chips to inspect source excerpts.
- Switch among all eight artifact tabs with mouse, touch, or keyboard.
- Answer all quiz questions and retry. Flip flashcards and swipe their carousel.
- Drag mind-map nodes, or focus a node and use arrow keys; its connection follows.
- Generate an artifact: choose sample sources, choose a format, then watch the simulated progress.
- Copy an artifact, download real Markdown, or share with the Web Share API. PDF and DOCX actions are explicitly labeled demo previews.
- Add local files to the playground. Only file names and sizes are displayed; no file content is read or uploaded. Chat continues to use the bundled sample sources.
- Send suggested prompts or a custom question. Replies stream from prewritten sample content. The quiz prompt creates an interactive quiz.
- Resize playground panels on desktop; use Sources / Chat / Artifacts tabs on mobile.
- Change billing frequency, open FAQ answers, or submit a mock newsletter address.

Pricing, usage counters, testimonials, social links, PDF/DOCX export, and homepage privacy controls are product illustrations. Demo notices keep that distinction visible. Newsletter submissions and files selected in the homepage playground are held only in browser memory. The account and workspace routes use the application API.

## Checks

```powershell
npx tsc --noEmit
npm run lint
npm run build
npm run test:auth-workspace # requires frontend and backend servers on their default ports
npm run test:frontend # comprehensive UI checks with synthetic API fixtures
npm run test:e2e # live frontend/backend flow; creates and removes temporary test accounts
# Optional isolated browser smoke check:
npx playwright install chromium
npm run test:smoke
```

The live E2E test uses synthetic data and requires the backend database and processing services. It reports blocked processing separately from application failures. For direct backend processor tests, run `npm run test:processors` in `server`; use `npm run test:processors -- --vectors-only` to check extraction, embedding and retrieval without repeating artifact generation. Reports and screenshots are saved in the ignored `client/preview` directory.

## Connecting a real API later

Replace the arrays in `lib/mock-data.ts` with typed data supplied to sections or fetched through your existing query layer. Artifact views already accept content props; extend ArtifactRenderer to pass the relevant content from a validated Artifact payload. Keep source IDs and citations in the API contract rather than deriving them from displayed text.

Replace Playground’s `send` handler with an authenticated request to your future chat endpoint. Stream SSE or newline-delimited JSON events through a ReadableStream: append text delta events to the current assistant message, attach citation events containing source ID / page / excerpt, and mark the message complete on the final event. Use AbortController to cancel on unmount or when starting another request; handle non-2xx responses and interrupted streams in the UI. The Typewriter component is only a visual simulator and should be replaced by the actual accumulated stream text.

Replace GenerateDialog’s timer with a generation job: submit selected source IDs and ArtifactType, display job progress, then render the returned structured content. Replace local file metadata with your upload + indexing flow, and use a source status field for Progress. Implement PDF/DOCX export at your document-generation boundary. Account creation, billing, newsletter subscriptions, sharing permissions, encryption, and privacy claims need actual services before launch.

## Brand logo

`components/landing/Logo.tsx` renders the homepage mark with the active emerald and gold tokens. The supplied `public/logo.png` remains in place for browser icons and social previews through `lib/brand.ts`.
