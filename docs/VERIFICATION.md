# Verification record

Verified 25 October 2026.

- ESLint: passed.
- TypeScript: passed through production build.
- Automated tests: 15 passed, covering scoring, numeric equivalence, adaptive routing, module completeness, validation, attempt ownership, stale saves, deadline rejection, and answer-key exposure. API tests use an in-memory database substitute.
- Production build: Next.js webpack build checked locally.
- Browser: desktop homepage, 390px mobile layout, study navigation, correct quiz feedback, and Jerry mascot layout checked.
- Source ZIP: integrity checked; excludes local secrets, backups, PDFs, archives, node_modules, and build output.

Not verified against live services: Google OAuth consent/redirect configuration, Supabase SQL execution and persistence, owner moderation on a live database, paid OpenRouter generation, embedded Desmos with a valid key, and a live Jerry AI provider. No paid generation or deployment was performed.

The library contains 16 original foundation lessons. Eighteen test slots are present but require reviewed question banks before publication. Scoring remains provisional and uncalibrated.
