# GOATPrep: from your folder to a published SAT prep website

This is the main step-by-step handoff. You can follow it in VS Code without ChatGPT.
Commands below are for Windows PowerShell, opened in C:\sat-simulator.
Replace placeholders such as YOUR_PROJECT with your own values. Do not paste the placeholder itself.

## What is ready, and what still needs your work?

Ready: the website, original foundation lessons, Google sign-in integration, real account counts,
student reviews and owner moderation, saved progress, an adaptive test interface, estimated scoring,
and the question generation/review/import tools.

You still need to configure your cloud accounts, generate and personally review questions,
and publish the site. No paid question-generation requests were made during this handoff.
The 18 test cards are placeholders until you publish reviewed banks.

The visual theme is white, signature bright purple (#7628ED), and deep-purple accents.
Jerry is a small animated emoji-style goat. Motion respects reduced-motion preferences.

## 1. Understand the process

1. Run the website locally (on your own computer).
2. Set up Neon (the online database) and Supabase Auth (Google sign-in).
3. Configure Google sign-in.
4. Preview the question plan without paying.
5. Generate a small batch through OpenRouter.
6. Review the questions yourself, then finish one full test.
7. Import approved questions into the database.
8. Test the whole experience locally.
9. Publish through Vercel (the service that runs the website).
10. Check the published site, then repeat generation for the remaining tests.

A JSON file is a structured text file containing the questions.
SQL is the language used to create and update database tables.
An API key lets a program access your service account.
An environment variable is a setting stored separately from source code.
A deployment is a published version of the application.

## 2. Install the tools

Install VS Code, Node.js 22 or newer, Python 3.10 or newer, and Git from their official sites.
During Python installation enable the Python launcher/PATH option.
Open the project folder in VS Code and choose Terminal > New Terminal.

Check:
```powershell
node --version
npm --version
py --version
git --version
npm ci
npm run dev
```

Open the local address printed by Next.js, normally http://localhost:3000.
Leave that terminal running. Use another terminal for generation.
If PowerShell blocks npm.ps1, use npm.cmd in place of npm in every command.
If py is missing but python works, replace py with python.
The question generator uses only Python's standard library and contains its own prompts and blueprint. The separate study generator needs the packages in scripts/requirements-study.txt.

## 3. Create your private configuration

Open .env.example, then create .env.local using those variable names.
If .env.local already exists, edit it; do not overwrite useful existing settings.

Never put .env.local, the backups folder, or your API keys in public/.
Never prefix a private service key with NEXT_PUBLIC_.
The supplied source ZIP excludes secrets and archived books.

For now set JERRY_ENABLED=false. Jerry will use local lesson guidance with no live AI bill.
OpenRouter is used offline for generating the test bank, not on each student visit.

## 4. Create the Neon database and keep Google authentication

Neon stores questions, tests, lessons, reviews, profiles, progress and attempts. Supabase is retained only for Google authentication. Vercel hosts the website. These are three separate services.

1. Create a free project at https://console.neon.tech. Choose a region near your users and hosting region.
2. In Neon's SQL Editor, paste and run **neon/schema.sql** using the database owner. Do not run the legacy supabase SQL scripts in Neon.
3. Open Connect, select the pooled connection, and copy its PostgreSQL connection string into **DATABASE_URL** in .env.local. Keep sslmode=require. This is a private server setting; never prefix it NEXT_PUBLIC_.
4. Keep your existing Supabase project, or create one for authentication. Copy its project URL and publishable/anon key into NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
5. Set ADMIN_EMAILS to your Google email address. Only those signed-in accounts can select homepage reviews.
6. Restart the development server after editing environment settings.

The server verifies the Supabase session, then creates/updates that user's Neon profile. Account counts come from real profiles. No service-role key is needed on Vercel. Run the account sync below to include accounts that existed before this migration or were created without opening the app.

### If your existing Supabase database contains student data

Skip this subsection for a fresh application with no stored data. Stop student writes during transfer (take the old deployment offline temporarily); otherwise changes made after the source snapshot will not be copied.

1. Keep a private database backup and your approved JSON files.
2. Create an empty Neon database and run neon/schema.sql.
3. In Supabase Connect, copy a PostgreSQL connection string that your computer can reach. The session pooler can be used on IPv4-only networks. Set SOURCE_DATABASE_URL locally; keep DATABASE_URL pointing to Neon.
4. Install the dependencies and copy the data:

```powershell
py -m pip install -r scripts/requirements-study.txt
py scripts/migrate_to_neon.py
```

The script refuses a nonempty destination, reads a consistent source snapshot, verifies row counts, and commits all copied tables together. A failed transaction rolls back. It does not delete source data or transfer passwords. Google users remain in the existing Supabase Auth project, with the same IDs. Only GOATPrep tables are copied; older prototype tables are not silently converted.

5. Test the local app against Neon, including sign-in, a saved attempt and reviews. Then add DATABASE_URL to the hosted app and redeploy. Reopen access only after verifying the new deployment.
6. Remove SOURCE_DATABASE_URL when finished. Retain the old database backup. Do not delete the Supabase Auth project.

For account-count synchronization, set SUPABASE_SERVICE_ROLE_KEY **locally only**, then run:

```powershell
node --env-file=.env.local scripts/sync-neon-accounts.mjs
```

This adds existing accounts without deleting student records. Deleting an authentication account does not automatically delete its Neon profile now that they are separate services. For an account-deletion request, delete the matching profiles row in Neon too; its dependent reviews, attempts and progress cascade. Keep backups and retention policies in mind. Run the sync after importing or administering accounts to keep counts current.

## 5. Enable Google sign-in

1. Create or select a project in Google Cloud Console.
2. Open Google Auth Platform and configure the app name as GOATPrep.
3. Choose the audience appropriate for public students.
4. Create an OAuth client of type Web application.
5. In Supabase > Authentication > Providers > Google, copy the callback URL.
6. Add that exact callback to Google's authorized redirect URIs.
   It normally looks like https://YOUR_PROJECT.supabase.co/auth/v1/callback.
7. Copy the Google client ID and client secret into Supabase's Google provider settings.
8. Enable the provider.
9. Under Supabase Authentication > URL Configuration, set Site URL to http://localhost:3000.
10. Add http://localhost:3000/** as an allowed redirect. Include port 3001 if you use it.
11. If the Google app is in testing mode, add your own Google account as a test user.
12. Sign into GOATPrep and confirm your profile exists in Neon's profiles table.

The homepage counts real profiles. It does not invent student numbers.
For public release, complete Google's publishing/verification steps required for your configuration.
Google's client secret goes in Supabase, not in the frontend source.

## 6–9. Generate, stop/resume, and review questions

Follow [GENERATE-QUESTIONS.md](GENERATE-QUESTIONS.md), the updated complete instructions.
The generator and all prompts are combined in scripts/generate_questions.py.
It uses your private content/reference-examples.json and requires only Python 3.10+.
Run it with VS Code's Run Python File command, or:

```powershell
py scripts/generate_questions.py --test 1 --dry-run
py scripts/generate_questions.py --test 1 --budget 5 --use-legacy-key
```

The second command can spend credits; 5 is an example cumulative reservation ceiling.
Stop with Ctrl+C and rerun the same command later. Draft, audit and editorial stages
are checkpointed; operating-system locks release automatically after a crash or restart.
Accepted questions are saved one by one. An interrupted in-flight API call may repeat.
No separate prompt file or Node installation is needed for generation.

When complete, use the review workflow in GENERATE-QUESTIONS.md and save the approved
download as content/test-1.reviewed.json before proceeding below.

## 10. Import into SQL and make the test available

Check DATABASE_URL and the Neon schema again, then:
```powershell
npm run content:import -- content/test-1.reviewed.json --publish
```

This stores the question rows and publishes the test together.
Omit --publish if you only want to store an unpublished draft.
Refresh GOATPrep; Practice Test 1 should be available.
The other cards remain In preparation until their banks are published.

After any student has attempted a test, the import refuses to overwrite its questions.
This protects the meaning of saved scores. Use a separate test/version instead.
Repeat the process with --test 2 through --test 18, using each test's matching filenames.
Do not upload the JSON banks into public/: that would expose answers.

## Generate the Study resources

Follow **GENERATE-STUDY.md** for the separate PDF-to-lessons workflow: extract locally, inspect the topic plan, generate with a spending ceiling, review in the browser, and publish approved lessons to Neon. Published lessons appear automatically in Study and are available to Jerry's library retrieval. No rebuild is needed. Keep PDFs and source excerpts private.

## 11. Test before sharing

```powershell
npm run lint
npm run typecheck
npm test
py -m unittest discover -s tests -p "test_generator.py"
npm run build
npm start
```

Stop the development server first if it is occupying the same port.
Check all of the following manually with your configured accounts and a published test:
- Google login and logout; a new account changes the count.
- Lesson completion persists after refresh.
- The test starts, saves answers, advances modules, and shows an estimated score.
- Refresh does not reset the current module timer.
- Answer review appears after finishing, not during a test.
- A student can submit a review; the owner can feature and remove it.
- Another student's private results cannot be accessed.
- Phone navigation, buttons and text are usable.
- Jerry's library response works and the mascot stays small.
- Desmos works with your approved NEXT_PUBLIC_DESMOS_API_KEY, or the fallback link works.

The automated tests do not replace real Google, database and full-duration browser checks.

## 12. Publish with Vercel

For a personal/noncommercial project, Vercel Hobby is the intended free hosting option.
Use a free vercel.app address. A purchased custom domain is optional and costs extra.
Neon, Supabase Auth and Vercel free plans have usage limits; they are not unlimited infrastructure.
Stay on Free/Hobby, avoid paid add-ons, and monitor usage. No host can be promised free forever
under all future traffic or policy changes.

Simple GitHub deployment:
1. Create a PRIVATE GitHub repository.
2. In VS Code Source Control, initialize the project if it is not already a repository.
3. Before committing, inspect the file list. It must exclude .env.local, backups, archive,
   input_pdfs, content, node_modules, .next, temporary folders and output.
4. Commit the source and publish it to that private repository using VS Code.
5. Sign into Vercel and choose Add New > Project.
6. Import that repository and select Next.js. Root directory is the project root.
7. Keep the build command npm run build and default Next.js output settings.
8. Add these environment variables to the Production environment:
   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
   DATABASE_URL, ADMIN_EMAILS, JERRY_ENABLED=false,
   and NEXT_PUBLIC_DESMOS_API_KEY if you have one.
9. Do NOT add OpenRouter generation keys to Vercel; generation runs on your computer.
10. Click Deploy and wait for the build to succeed.
11. Open the resulting https://YOUR_SITE.vercel.app address.

The database already contains your imported questions; you do not upload them separately to Vercel.
After changing environment variables, redeploy so browser-facing values are rebuilt.

## 13. Fix login redirects for production

In Supabase Authentication > URL Configuration:
1. Change Site URL to your actual HTTPS production address.
2. Add https://YOUR_SITE.vercel.app/** as an allowed redirect.
3. Keep localhost redirects if you still develop locally.

The Google redirect URI remains the Supabase callback URL, not the Vercel homepage.
Test signing in on the deployed site with a student account.
A redirect mismatch usually means an exact URL/port is missing from one of these settings.

## 14. Reviews, Jerry, scores and maintenance

Owner reviews: sign in as ADMIN_EMAILS, open the avatar menu > Manage reviews.
Only selected real reviews appear on Home. Updating a student review removes its featured status.

Jerry: no model training is needed for the current library-based helper.
It retrieves lesson information. Live AI is optional and requires a provider compatible with
your audience and budget. Configure JERRY_API_URL (an OpenAI-compatible chat-completions endpoint), JERRY_API_KEY and JERRY_MODEL before setting JERRY_ENABLED=true. Keep it disabled unless your provider permits the intended student audience and your chosen quota. A free live-AI service is not guaranteed. No live AI service is enabled here.

Scores: read docs/SCORING.md. These are uncalibrated estimates, not official SAT scores.
Official scoring relies on statistical calibration not supplied with an AI-generated bank.
Do not advertise exact score prediction or identical Bluebook behavior.

Keep private copies of approved JSON and your database exports.
Monitor provider dashboards and errors. Test a deployment after every source or environment change.
If a deployment is faulty, use Vercel's previous deployment/rollback option, then fix locally.
Never change a live test's answers without considering students' existing attempts.

## Troubleshooting

- Model unavailable: use --check-models and explicitly set an available replacement.
- HTTP 401/403: check the key and model/provider access; never paste the key into public chat.
- HTTP 402: check your OpenRouter credit balance.
- HTTP 429: wait and rerun manually; saved items are retained.
- Connection/pricing error: fix internet access; generation stops before new calls.
- Content rejected twice: inspect the skill/prompt; try a better model and resume.
- Missing slots: generation is unfinished; continue, then validate again.
- Reviewed flag missing: approve items in the review HTML and use its downloaded JSON.
- Sign-in unavailable: check Supabase variables, provider settings, redirect URLs, and restart.
- Test not appearing: ensure --publish was used and all SQL functions were installed.
- Import blocked by attempts: preserve that test; use another test slot/version.
- Free quota exhausted: reduce usage or wait for the provider's reset; do not enable paid upgrades unintentionally.

## Official references

- [OpenRouter chat API](https://openrouter.ai/docs/api/api-reference/chat/send-chat-completion-request)
- [OpenRouter structured output support](https://openrouter.ai/docs/guides/features/structured-outputs)
- [College Board content domains](https://satsuite.collegeboard.org/practice/content-domains)
- [Vercel Hobby eligibility and limits](https://vercel.com/docs/plans/hobby)
- [Supabase billing and free-plan information](https://supabase.com/docs/guides/platform/billing-on-supabase)

These references were checked for the handoff; dashboard labels and provider policies may change.

## Database capacity and themes

As checked on October 26, 2026, [Neon Free](https://neon.com/pricing) lists 1 GB of database storage per project and 100 CU-hours (compute usage) monthly per project. Store lesson text and question JSON in Neon, not the book PDFs. Monitor the dashboard: free storage and compute are finite and terms can change. Using Neon does not replace Vercel hosting.

The moon/sun button switches between solid light and dark themes. The setting is saved in the visitor's browser; first visits follow the device preference. Bright purple #7628ED is the signature action color. Jerry remains a simple animated goat-head image. The timed exam uses its own legible exam surface.

## Handoff limits

The local source, generators and migration tools are provided. No paid generation, production deployment, or live database transfer has been performed as part of this update. Supply your real service settings, run the migration only if needed, and complete docs/LAUNCH-CHECKLIST.md. Eighteen published tests require eighteen fully generated and independently reviewed banks. AI-generated difficulty and provisional scores cannot be promised identical to the official SAT.
