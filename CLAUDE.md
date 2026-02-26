# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup          # First-time setup: install deps, generate Prisma client, run migrations
npm run dev            # Start dev server with Turbopack on port 3000
npm run build          # Production build
npm run lint           # Run ESLint
npm run test           # Run all Vitest tests
npx vitest run src/path/to/file.test.ts  # Run a single test file
npx prisma migrate dev # Run DB migrations
npm run db:reset       # Reset SQLite database
```

Environment: copy `.env` and set `ANTHROPIC_API_KEY`. Without it, the app falls back to a `MockLanguageModel` in `src/lib/provider.ts`.

## Architecture

UIGen is a Next.js 15 (App Router) application that lets users generate and preview React components via Claude AI.

### Core Data Flow

```text
User Chat → /api/chat/route.ts → Claude (claude-haiku-4-5) with tools
  → tool calls execute on VirtualFileSystem (in-memory)
  → streamed results update FileSystemContext
  → PreviewFrame re-renders live preview in iframe
```

### Virtual File System

`src/lib/file-system.ts` — All "files" live in a `Map`-backed in-memory tree. Nothing is written to disk. The AI operates on this FS via two tools:

- **`str_replace_editor`** (`src/lib/tools/str-replace.ts`): view, create, str_replace, insert operations
- **`file_manager`** (`src/lib/tools/file-manager.ts`): rename and delete

Tool calls come from Claude, get executed in `FileSystemContext` (`src/lib/contexts/file-system-context.tsx`), and trigger a preview refresh.

### State Management

Two React contexts hold all runtime state:

- **`FileSystemContext`** — virtual FS state, tool call dispatch, refresh trigger
- **`ChatContext`** — wraps Vercel AI SDK's `useChat`, integrates with FileSystemContext's `handleToolCall`

### Live Preview

`src/components/preview/PreviewFrame.tsx` renders an iframe. `src/lib/transform/jsx-transformer.ts` uses `@babel/standalone` in-browser to transpile JSX, resolving `@/` aliases and mapping imports to CDN URLs (esm.sh). Entry point is `/App.jsx` by convention.

### Authentication & Persistence

JWT stored in an HttpOnly cookie (7-day expiry). Only authenticated users can persist projects. Projects store serialized file system state and chat messages as JSON strings in SQLite via Prisma.

**Schema:** `User` → `Project` (one-to-many). `Project.data` = serialized `VirtualFileSystem`, `Project.messages` = serialized chat history.

Middleware (`src/middleware.ts`) protects `/api/projects` and `/api/filesystem` routes. Anonymous users get full functionality with no DB persistence — tracked via `src/lib/anon-work-tracker.ts` (localStorage).

### Key File Map

| Concern | File |
| --- | --- |
| AI chat API + Claude integration | `src/app/api/chat/route.ts` |
| System prompt for Claude | `src/lib/prompts/generation.tsx` |
| Language model (real vs mock) | `src/lib/provider.ts` |
| Virtual FS core class | `src/lib/file-system.ts` |
| File state + tool dispatch | `src/lib/contexts/file-system-context.tsx` |
| Chat state (useChat wrapper) | `src/lib/contexts/chat-context.tsx` |
| JSX transform + import map | `src/lib/transform/jsx-transformer.ts` |
| Main UI layout (resizable panels) | `src/app/main-content.tsx` |
| Auth server actions | `src/actions/index.ts` |
| JWT session helpers | `src/lib/auth.ts` |

### Path Alias

`@/*` maps to `src/*` (configured in `tsconfig.json` and respected in preview via the JSX transformer's import map).

### Testing

Tests live in `__tests__/` subdirectories alongside source. Uses Vitest + JSDOM + Testing Library. Test coverage includes: virtual FS operations, JSX transformer, chat/editor contexts, and UI components.

### Development Best Practices

- Use comments sparingly. Only comment complex code.
