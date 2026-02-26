# Security Audit — February 2026

**Date:** 2026-02-25
**Tool:** `npm audit` + manual dependency upgrades
**Result:** 11 vulnerabilities → 0 vulnerabilities

---

## Vulnerabilities Fixed

### Non-breaking fixes (`npm audit fix`)

| Package | Severity | Issue |
|---|---|---|
| `@eslint/plugin-kit` | Low | ReDoS via ConfigCommentParser |
| `ajv` | Moderate | ReDoS with `$data` option |
| `js-yaml` | Moderate | Prototype pollution via merge (`<<`) |
| `mdast-util-to-hast` | Moderate | Unsanitized class attribute (XSS) |
| `minimatch` | High | ReDoS via repeated wildcards |
| `rollup` | High | Arbitrary file write via path traversal |
| `tar` | High | Multiple: hardlink path traversal, symlink poisoning, APFS race condition |
| `vite` | Moderate | `server.fs.deny` bypasses |

### Breaking-change upgrades (manual migration)

| Package | Before | After | CVEs patched |
|---|---|---|---|
| `next` | 15.3.3 | 15.5.12 | 8 CVEs: RCE (GHSA-9qr9), SSRF (GHSA-4342), DoS ×3, cache confusion, content injection, source exposure |
| `ai` | 4.3.16 | 6.0.101 | Filetype whitelist bypass (GHSA-rwvc) |
| `@ai-sdk/anthropic` | 1.2.12 | 3.0.47 | (required by ai@6) |
| `zod` | 3.x (transitive) | 4.x | (required by ai@6) |

---

## Code Changes Required (ai v4 → v6 migration)

The `ai` SDK upgrade from v4 to v6 was a major version jump that required updates across 10 source files.

### API changes applied

| Old (v4) | New (v6) |
|---|---|
| `Message` type | `UIMessage` |
| `ToolInvocation` type | `UIToolInvocation` |
| `tool({ parameters: z.object(...) })` | `tool({ inputSchema: z.object(...) })` |
| `maxTokens` in `streamText` | `maxOutputTokens` |
| `maxSteps: n` | `stopWhen: stepCountIs(n)` |
| `result.toDataStreamResponse()` | `result.toUIMessageStreamResponse({ originalMessages, onFinish })` |
| `appendResponseMessages(...)` | `toUIMessageStreamResponse.onFinish({ messages })` |
| `convertToModelMessages(msgs)` | `await convertToModelMessages(msgs)` (now async) |
| `useChat({ api, initialMessages, body })` | `useChat({ messages, transport: new DefaultChatTransport({ api, body }) })` |
| `useChat` returns `input`, `handleSubmit` | Manage input state locally; call `sendMessage({ text })` |
| Tool state `"call"` / `"result"` | `"input-available"` / `"output-available"` |
| Tool part `args` / `result` | `input` / `output` |
| `LanguageModelV1` | `LanguageModelV2` (add `supportedUrls: {}`) |
| Stream part `textDelta` | `delta` + `id`; wrap with `text-start`/`text-end` |
| Usage `promptTokens`/`completionTokens` | `inputTokens`/`outputTokens`/`totalTokens` |

### Files modified
- `src/app/api/chat/route.ts`
- `src/lib/contexts/chat-context.tsx`
- `src/lib/provider.ts`
- `src/lib/tools/file-manager.ts`
- `src/lib/tools/str-replace.ts`
- `src/components/chat/MessageList.tsx`
- `src/components/chat/ToolCallBadge.tsx`
- `src/components/chat/__tests__/MessageList.test.tsx`
- `src/components/chat/__tests__/ToolCallBadge.test.tsx`
- `src/lib/contexts/__tests__/chat-context.test.tsx`

---

## Test Results

- **Before:** 236/237 passing (1 pre-existing failure in `ChatInterface` layout test)
- **After:** 236/237 passing (same pre-existing failure, no regressions introduced)
