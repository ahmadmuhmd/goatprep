# Final handoff — October 26, 2026

The project now uses Neon for application data and Supabase only for Google authentication. Vercel remains the intended website host. Existing-data transfer is available through scripts/migrate_to_neon.py; no live transfer was performed without the destination connection string.

Implemented: parameterized Neon queries, atomic test publication, profile synchronization, dynamic published study lessons, single-file resumable question generator, separate resumable PDF study generator, approval gates, light/dark themes, bright-purple identity, academic copy, and emoji-style Jerry.

Verification: 22 JavaScript tests and 19 Python tests passed. ESLint, TypeScript and the production build passed. Browser checks confirmed light/dark switching, persistence across refresh, and the Study fallback. The generated study-review page's JavaScript passed syntax checking. The local PDF plan found candidate source pages for all 35 topics; candidate matching does not replace checking source relevance.

Not performed: paid AI generation, live Neon schema execution/data transfer, real OAuth login, production deployment, or empirical SAT-score calibration. No generated bank is advertised as official. Each bank includes six stored modules (147 questions); each student receives four modules (98 questions), with independent easy/hard second-module routing for each section.

Start with GOATPrep-START-TO-PUBLISH.md. The source ZIP excludes secrets, private reference books, generated content, and checkpoints. Preserve those local files separately before moving computers.
