# closecopy

A complete, dark-first landing page for an AI source workspace. Built in the existing Next.js 16 App Router project with TypeScript, Tailwind CSS 4, the repository’s Base UI-based shadcn components, Framer Motion, Lucide, Lenis, and Sonner.

## Install and run

The only missing shadcn component was **sonner**, now added by the official CLI. All pre-existing generated UI files were preserved.

```powershell
cd client
npx shadcn@latest add sonner
npm install
npm run dev
```

For this completed checkout, Sonner is already present: just run `npm install` and `npm run dev`. Visit http://localhost:3000.

To add the runtime dependencies to another copy of the original repo:

```powershell
npm install framer-motion lenis sonner @fontsource-variable/geist @fontsource-variable/geist-mono @fontsource/instrument-serif
```

The fonts are self-hosted from npm packages. Building and rendering require no Google Fonts connection. Node 20.9+ is required by the existing Next.js version.

## Theme variables

Theme changes live in `app/globals.css`. Both `:root` and `.dark` use the dark palette. Components reference semantic Tailwind tokens; generated primitives are untouched.

| Variable           | Value     | Purpose                 |
| ------------------ | --------- | ----------------------- |
| --background       | #09090B   | Near-black canvas       |
| --foreground       | #F4F3FA   | Primary text            |
| --card             | #111115   | Glass surfaces          |
| --primary          | #8B5CF6   | Electric violet         |
| --accent-end       | #22D3EE   | Cyan gradient endpoint  |
| --citation         | #C6CF8D   | Warm citation highlight |
| --muted-foreground | #9897A7   | Secondary text          |
| --border           | #FFFFFF12 | Translucent borders     |

The font variables map to Geist Variable, Geist Mono Variable, and Instrument Serif. Custom gradient styles combine the primary and accent-end variables. Reduced-motion media rules suppress primitive CSS transitions, while MotionConfig and an SSR-safe reduced-motion preference hook govern Framer Motion. Lenis, cursor glow, autoplay, and ambient loops are disabled for reduced motion.

## Structure

- `app/page.tsx`: composes all twelve sections in order.
- `app/layout.tsx`: metadata, dark theme, shared providers and Toaster.
- `components/sections/`: Navbar, Hero, Marquee, Features, ArtifactsShowcase, HowItWorks, Playground, Testimonials, Pricing, FAQ, CTA, Footer.
- `components/artifacts/`: reusable SummaryArtifact, StudyGuideArtifact, QuizArtifact, FlashcardArtifact, MindMapArtifact, TimelineArtifact, ReportArtifact, SlidesArtifact, and ArtifactRenderer.
- `components/landing/`: custom visual helpers and motion wrappers around existing primitives; no regenerated UI components.
- `components/ui/`: existing shadcn components plus the officially generated sonner wrapper.
- `lib/mock-data.ts`: typed sources, excerpts, chat scripts, artifact content, pricing, FAQ, and sample testimonials.
- `lib/artifact-export.ts`: local Markdown serialization and download.
- `types/index.ts`: Source, Citation, ArtifactType, Artifact, ChatMessage, QuizQuestion.

## State management

TanStack Query is available throughout the app through `components/landing/Providers.tsx`. `lib/get-query-client.ts` creates a fresh Query Client for each server render and reuses one in the browser, with a 60-second default stale time. Use it for API data and mutations when real endpoints are connected.

Zustand is installed for shared client UI state. `stores/use-workspace-ui-store.ts` provides a typed workspace panel selection as a starting store; import its hook in client components and select only the state or action needed. Keep fetched workspace, source, and artifact data in TanStack Query rather than duplicating it in Zustand. The landing demo still uses its local sample state and makes no API calls.

## Try the interactions

- Pause or play the hero’s looping three-panel workspace.
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

`public/logo.png` is the supplied logo and the single source for branding. `lib/brand.ts` defines its presentation frame; `components/landing/Logo.tsx` reuses it in navigation, the mobile drawer, footer, workspace chrome, and assistant avatars. The original image is unchanged. `app/icon.tsx` and `app/apple-icon.tsx` generate browser and home-screen icons from that same asset at build time. Root metadata also uses it for social previews.
