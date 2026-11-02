# GOATPrep

**Free forever.** Independent, text-based SAT preparation.

Start with [GOATPrep-START-TO-PUBLISH.md](GOATPrep-START-TO-PUBLISH.md) for the complete VS Code, Neon, Supabase Google login, question-generation, review, and deployment workflow.

```sh
npm ci
npm run dev
```

Node.js 22+ recommended. Copy the needed values from .env.example into .env.local.

## Included

- Light/dark white and signature-purple responsive interface, solid surfaces and deep-purple accents, gentle motion
- Google authentication through Supabase
- Real account count, student reviews, owner-curated homepage reviews
- 16 original foundation lessons plus resumable PDF-based lesson generation, Neon publication and automatic Study loading
- 18 practice-test slots, unpublished until complete reviewed content is imported
- Server-graded adaptive test runner, notes, flags, numeric responses, timers, saved attempts, score review
- Jerry's animated goat head, free lesson retrieval, optional compatible AI backend
- OpenRouter drafting + independent audit, budget reservations, validation, local editorial reviewer
- Neon database, existing Supabase data-transfer script, atomic database import, answer-key protection, regression tests

## Verification

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

Scoring is provisional and uncalibrated. See [docs/SCORING.md](docs/SCORING.md).
Live account/provider setup and content review remain owner-run steps. See [docs/LAUNCH-CHECKLIST.md](docs/LAUNCH-CHECKLIST.md).

