# Repository instructions

Before modifying this repository:

1. Read AGENTS.md
2. Read PROJECT_CONTEXT.md
3. Read README.md
4. Inspect git status
5. Preserve repository → service → actions → components architecture
6. Never bypass Supabase RLS
7. Do not introduce multi-school architecture unless explicitly requested
8. Do not modify database migrations unless the assigned task requires it

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
