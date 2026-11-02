# Owner-run launch checks

These require your actual Google, Supabase Auth and Neon accounts; they were not performed against a live configured backend.

- [ ] Run neon/schema.sql. Verify RLS is enabled on all GOATPrep tables.
- [ ] Sign in with Google locally and on the deployed URL.
- [ ] Sign out, refresh, and sign back in; history remains associated with the same account.
- [ ] Verify one new authentication account adds one to the homepage count.
- [ ] Submit a review using a normal student account.
- [ ] Confirm it is absent from Home until your owner account features it.
- [ ] Confirm a non-owner cannot feature/delete reviews using the API or /#admin.
- [ ] Edit a featured review and verify it is removed from Home until selected again.
- [ ] Complete a lesson and confirm progress survives sign-out and sign-in.
- [ ] Generate, independently review, validate, and import one complete test.
- [ ] Complete both easy and hard routes in separate test attempts.
- [ ] Check Math routing does not depend on Reading & Writing answers.
- [ ] Leave questions blank and confirm they count as incorrect.
- [ ] Check fraction/decimal equivalence against the question's accepted answers.
- [ ] Refresh during a module; answers and deadline persist.
- [ ] Verify conflicting saves in a second tab cannot overwrite newer answers.
- [ ] Disconnect briefly; verify failed-save warning and retry.
- [ ] Check every score report question, including unscored trial items.
- [ ] Confirm students cannot retrieve answer keys before completion or another user's attempt.
- [ ] Enable and verify your approved Desmos key if embedding is required.
- [ ] Keep Jerry in free library mode unless an eligible live AI arrangement is configured.
- [ ] If enabling AI, test quota enforcement, invalid inputs, provider errors, and off-topic requests.
- [ ] Verify light/dark switching and persistence after refresh.
- [ ] Publish a reviewed study lesson and verify it appears in Study.
- [ ] Check mobile widths, keyboard focus, zoom, and reduced-motion settings.
- [ ] Review privacy disclosures and retention choices for your student audience.
- [ ] Publish only actual reviews and measured account counts.
- [ ] Confirm no draft banks, PDFs, backups, or credentials are in public/.
- [ ] Run lint, typecheck, tests, and production build.
