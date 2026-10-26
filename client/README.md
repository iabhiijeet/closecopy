# closecopy

A light and dark landing page for an AI source workspace. Built with Next.js 16, TypeScript, Tailwind CSS 4, Base UI-based shadcn components, Sora, Framer Motion, Lucide, and Sonner.

## Install and run

```powershell
cd client
npm install
npm run dev
```

Visit http://localhost:3000. Sora is self-hosted through `@fontsource-variable/sora`; rendering requires no Google Fonts connection. Node 20.9+ is required by the existing Next.js version.

## Theme variables

Theme variables live in `app/globals.css`. Light mode is the default; the navigation toggle switches to dark mode and remembers the choice. Components use semantic color tokens and Sora throughout.

| Role               | Light     | Dark      |
| ------------------ | --------- | --------- |
| Background         | `#FAF8F4` | `#0F1412` |
| Cards              | `#FFFFFF` | `#171E1B` |
| Border             | `#E6E1D8` | `#26302C` |
| Text               | `#1A1F1D` | `#EDEAE3` |
| Muted text         | `#6B7370` | `#8E9893` |
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

TanStack Query is available throughout the app through `components/landing/Providers.tsx`. `lib/get-query-client.ts` creates a fresh Query Client for each server render and reuses one in the browser, with a 60-second default stale time. Use it for API data and mutations when real endpoints are connected.

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

Pricing, usage counters, testimonials, authentication, social links, PDF/DOCX export, semantic retrieval, and privacy controls are product illustrations. Demo notices keep that distinction visible. Newsletter submissions and selected files are held only in browser memory. No application API calls are made.

## Checks

```powershell
npx tsc --noEmit
npm run lint:landing
npm run build
# Optional isolated browser smoke check:
npx playwright install chromium
npm run test:smoke
```

Full-repo `npm run lint` also checks the untouched generated code. It currently reports pre-existing `react-hooks/set-state-in-effect` errors in `components/ui/carousel.tsx:98` and `hooks/use-mobile.ts:14`. The landing-page check keeps these separate while respecting the instruction to preserve existing primitives.

## Connecting a real API later

Replace the arrays in `lib/mock-data.ts` with typed data supplied to sections or fetched through your existing query layer. Artifact views already accept content props; extend ArtifactRenderer to pass the relevant content from a validated Artifact payload. Keep source IDs and citations in the API contract rather than deriving them from displayed text.

Replace Playground’s `send` handler with an authenticated request to your future chat endpoint. Stream SSE or newline-delimited JSON events through a ReadableStream: append text delta events to the current assistant message, attach citation events containing source ID / page / excerpt, and mark the message complete on the final event. Use AbortController to cancel on unmount or when starting another request; handle non-2xx responses and interrupted streams in the UI. The Typewriter component is only a visual simulator and should be replaced by the actual accumulated stream text.

Replace GenerateDialog’s timer with a generation job: submit selected source IDs and ArtifactType, display job progress, then render the returned structured content. Replace local file metadata with your upload + indexing flow, and use a source status field for Progress. Implement PDF/DOCX export at your document-generation boundary. Account creation, billing, newsletter subscriptions, sharing permissions, encryption, and privacy claims need actual services before launch.

## Brand logo

`components/landing/Logo.tsx` renders the homepage mark with the active emerald and gold tokens. The supplied `public/logo.png` remains in place for browser icons and social previews through `lib/brand.ts`.
