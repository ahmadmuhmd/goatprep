# GOATPrep: three-day, zero-dollar website and Android launch plan

This is the current launch plan, checked on November 14, 2026. Commands are for Windows
PowerShell opened in `C:\sat-simulator`. It targets a working Next.js website plus an
installable Android PWA. It avoids paid AI calls, a paid domain, and the Google Play full-
distribution fee. The older setup reference begins below.

## Current project status

- The Next.js 16 App Router website, API routes, lessons, adaptive test runner, authentication
  client, score/progress features, and moderator tools already exist.
- `content/test-1.json` through `content/test-12.json` each contain 147 questions and pass the
  project's default structural/blueprint validation. Tests 13–18 have no question-bank files.
- The 12 banks have **zero human-reviewed questions**. Tests 3, 5, and 7 also contain 7, 22,
  and 20 generated-only questions without `audit_passed`. The current publishing script requires
  every question to have both `audit_passed` and `reviewed`; as-is, it will reject those banks.
- The OpenRouter key shown in the supplied log reached its $17 total limit. Do not rerun
  generation against it: Copilot Student is useful for coding, but it is not a drop-in generation
  API or a free bulk-content allowance for `fill_missing_questions.py`.
- Supabase settings are present in the local `.env.local`, but `DATABASE_URL` and `ADMIN_EMAILS`
  are not configured there. This update adds the PWA manifest and Android-sized app icons, and
  changes the page copy to avoid a lifetime hosting promise. There is no local Vercel project link
  or production deployment yet. `npm run typecheck` and `npm run build` pass locally; I checked
  whether environment values are set without displaying any secrets.
- `/content/` and `.env*` are ignored by Git. Keep question answers and credentials out of the
  public repository.

## The three-day finish line

By Day 3, the target is a live HTTPS site on a free `*.vercel.app` address, Google sign-in,
Neon-backed progress, and an Android-installable PWA that runs the same app in a standalone
window. The PWA remains online-dependent; offline practice and push notifications are later work.

For content, the safe three-day launch is one manually reviewed, published practice test plus the
existing Study library; the other complete banks remain “In preparation” until reviewed. A broad
beta containing all 12 banks is technically possible only after adding an explicit beta import
path that does not claim the banks were audited or reviewed. That route needs a visible beta label
and your decision to accept the content risk. Tests 13–18 are out of the zero-spend scope because
their banks do not exist; authoring and reviewing another 882 questions is outside the three-day
zero-dollar scope. Copilot's student coding allowance is not a bulk SAT-content service.

## Zero-cost stack and guardrails

| Part | Use | Free-plan boundary |
|---|---|---|
| GitHub | Source, pull requests, CI and security alerts | Student GitHub Pro; standard GitHub-hosted Actions runners are free for public repositories. Private-repository Actions use included compute and can become billable if overages are allowed. |
| GitHub Education community | Get peer feedback, possible collaborators, and student-project visibility through Education community resources, events and Campus Experts. | Ask for feedback/testers; this is community support, not a guaranteed project team or paid service. |
| Vercel | Host the existing Next.js app and its API routes | Hobby is $0 for personal/non-commercial use, with usage caps; use its `vercel.app` hostname and do not add a paid domain. |
| Neon | Existing Postgres data model | Free plan currently includes 100 CU-hours and 1 GB storage per project; it scales to zero and suspends compute if monthly limits are exhausted. |
| Supabase | Keep existing Google OAuth | Free plan currently includes 50,000 monthly active users, 500 MB database storage, 5 GB egress and 1 GB file storage; it allows two active projects and pauses projects after a week of inactivity. GOATPrep uses Supabase for Auth and Neon for app data. |
| Android | Install the PWA from Chrome | No store account or app fee. Android Developer Console's separate limited-distribution account is free for up to 50 authorized devices; Google Play full distribution still has a $25 one-time fee. |
| AI | No hosted AI in the product during launch | Keep `JERRY_ENABLED=false`; do not call OpenRouter or another metered model. Copilot Student helps write code but is not a production model/API allowance for students using GOATPrep. |

Use Vercel Hobby only while the project remains non-commercial; its current terms restrict the
plan to personal or non-commercial use. Free tiers have limits and can pause or suspend features,
so this plan does not promise unlimited lifetime hosting. See the [Vercel Hobby terms], [Neon Free
plan], [Supabase Free plan], and [Android distribution options].

## GitHub Education benefits that fit GOATPrep

Claim offers in the [current Student Developer Pack] and confirm each offer's activation and
expiry in your account. The catalog changes over time; the items below are the ones that can
directly accelerate this project or support it after launch.

| Benefit | Concrete use for this project | Priority / limit |
|---|---|---|
| GitHub Copilot Student | Build the PWA shell, write test cases, explain existing routes, draft accessible UI and review diffs faster. Student includes unlimited code completions plus a monthly AI-credit allowance; chat/agent use is limited and uses automatic model selection. | Activate now. Keep use inside the included allowance and disable/avoid any paid overage. It does not cover live Jerry answers or bulk SAT-question generation. |
| GitHub Pro | Keep the source private, use a task board with Issues/Projects, and add protected branches, code owners, and reviewable pull requests. | Activate while student-verified. Student eligibility is reevaluated monthly. |
| GitHub Codespaces | Open the repo in a cloud VS Code environment if the local machine blocks the three-day schedule. | Up to 180 core-hours and 20 GB storage monthly under the current student/Pro allowance. Stop unused Codespaces so they do not consume hours. |
| GitHub Actions | Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` on each pull request. | Standard runners are free for public repos; GitHub Pro gives a private repo an $18 monthly Actions compute allowance, after which use can be billed. Set a budget that stops usage at $0 overage. |
| Dependabot, rulesets and secret safety | Get dependency alerts, protect main, and avoid accidentally pushing credentials. | Use Dependabot alerts and Pro branch protections in the private repo. Free CodeQL/code scanning and repository secret-scanning alerts are for public repos; do not make this app public just to get them. Keep `.env.local`, `/content/`, backups and PDFs ignored, and scan before pushing. |
| GitHub Pages | Host a static project guide, release notes, or a public documentation page. | Do not host the app here: Pages is static and cannot run the Next.js API routes, Google-auth flow, or database writes. |
| BrowserStack or LambdaTest | Check Android Chrome and a few real mobile/browser combinations before launch. | BrowserStack's Student Pack lists one mobile parallel/one user for a year; LambdaTest lists a one-year live plan. Claim one, not both, for the first pass. |
| Polypane | Compare small-phone, tablet, and desktop layouts at once while tuning responsive CSS. | Individual plan listed free for one year. Use it as a convenience, not a release dependency. |
| Codecov and CodeScene | See which app code is untested and review maintainability across the private GitHub repository. | Codecov is offered for public and private repositories; CodeScene lists a free student account for private repositories. Add after the first CI run. |
| DeepScan | Run an extra JavaScript/TypeScript code-quality review on the web app. | Pack currently lists a six-month student trial. Use it as a secondary lint signal; the existing ESLint, typecheck and build remain the release gate. |
| Sentry, New Relic, Datadog or Honeybadger | See production errors and uptime after launch. Sentry is the simplest first choice for Next.js; Honeybadger is another small-project alternative. | Pack currently lists Sentry's student allowance (50K errors, 100K transactions, 1 GB attachments, 500 replays for one year; on-demand disabled), New Relic while a student, Datadog Pro for two years, and Honeybadger Small for a year. Add one service only after the core flow works. |
| Free domain offers | Name.com offers selected extensions; Namecheap lists a one-year `.me` domain and SSL; `.TECH` lists a one-year domain. | Optional. Use `*.vercel.app` for the zero-renewal MVP so a first-year offer cannot turn into a later bill. |
| Appwrite Education | A possible later all-in-one backend and SSR frontend host. | Pack lists two Education projects at Pro-equivalent resource limits for six months. Do not migrate during the launch sprint; compare quotas and exportability first. |
| Camber and Deepnote | Analyze a sanitized question-bank export: count blueprint coverage, difficulty balance and duplicates. | Camber Student currently includes 40 compute hours, 50 GB storage and 50 agent messages per month while enrolled; Deepnote Team is listed while a student. Treat outputs as review assistance, not proof an answer is correct. Never upload student attempts or identifying data. |
| Azure, Heroku and MongoDB Atlas credits | Experiments with alternative hosting, cloud services, or a document database. | Pack lists 25+ Azure services plus $100 credit for verified students age 18+ (and a separate no-card Azure offer for ages 13–17), Heroku $13/month credits for 24 months, and $50 MongoDB Atlas credits plus Compass/MongoDB University. Credits expire and may need account/billing setup; they are not a free-forever production budget. Keep the current stack. |
| Clerk Pro | Student-auth alternative if Supabase later becomes unsuitable. | Listed free while a student; replacing the existing Supabase login is migration work, so skip it for this launch. |
| Doppler and 1Password | Keep developer credentials organized and protected. | Doppler Team is listed free while an active student; 1Password is listed free for two years. Keep production values in Vercel and local secrets in `.env.local`; do not add a second secrets system in the three-day sprint. |
| Testmail | Exercise any future email-based account recovery or notification flows without using real student inboxes. | Essential plan listed free while a student. No email-based product flow is needed for the current release. |
| JetBrains, Frontend Masters, Educative, DataCamp, Boot.dev, Codédex and Microsoft Learn resources | Learn TypeScript/Next.js, accessibility, testing, database operations, and Android/PWA basics. | Student catalog lists a renewable JetBrains subscription; Frontend Masters and Educative for six months; DataCamp and Boot.dev for three months; and Codédex for one month under the offer effective November 1. Use one targeted course after the launch, not during the critical path. |
| GitKraken/GitLens, GitHub Desktop, Tower and Termius | Alternative Git history/SSH tools if the existing VS Code workflow becomes a bottleneck. | The Pack has student offers for GitKraken, Tower and Termius; GitHub Desktop is free for everyone. These are optional workflow choices, not required tools. |
| Pageclip, SimpleAnalytics, IconScout and localization/feature-flag tools | Add a simple static feedback form, privacy-friendly product metrics, original visual assets, translation, or staged feature rollout. | Pack currently lists Pageclip Basic while a student, SimpleAnalytics Starter for a year (100K page views/month), IconScout's 60 premium icons/month for a year, and tools such as POEditor/DevCycle. Add only if needed; avoid collecting unnecessary student data. |

The current Student Developer Pack catalog also includes other offers, but they do not help build,
test, host, secure, measure, or support this particular app; there is no reason to activate every
catalog item. Offers, durations, eligibility, and quotas can change, so check the [current Student
Developer Pack] before activation. Do not add a payment method just to claim a credit, and set
expiry reminders for trials and first-year domains. No Pack offer gives GOATPrep unlimited,
production AI generation. Copilot Student is for your development workflow, with unlimited code
completion but a capped monthly AI-credit allowance for chat/agent features; turn off paid overage.

GitHub Pages and the partner domain offers are not substitutes for the server host. The existing
app needs a Node-capable Next.js host because its `/api/*` routes execute server-side code. GitHub
Pages publishes static files only. See [GitHub Pages limits] and [Next.js deployment options].

## Three-day schedule

### Day 1 — backend and live website

1. Activate GitHub Pro, Copilot Student, and Codespaces if needed. Turn off paid AI overages and
   any GitHub usage that could bill after its included allowance.
2. Create or use one Neon Free project. Run `neon/schema.sql` in its SQL Editor; use the pooled
   connection string for `DATABASE_URL`. Set an autoscaling ceiling and leave scale-to-zero on.
3. Fill the local `.env.local` values for `DATABASE_URL` and `ADMIN_EMAILS`. Keep service secrets
   server-side; never add a `NEXT_PUBLIC_` prefix to the database or admin settings.
4. Import `ahmadmuhmd/goatprep` into Vercel Hobby. Add the required public Supabase URL/key,
   `DATABASE_URL`, and `ADMIN_EMAILS` as Vercel environment variables. Do not configure Jerry's
   AI variables or OpenRouter.
5. Add the Vercel production URL to Supabase Auth's Site URL and allowed redirect URLs, then add
   that exact URL to the Google OAuth web client's authorized redirect/origin settings. Deploy.
6. Confirm the home page loads on HTTPS, anonymous study data loads, Google sign-in returns to the
   app, and one test API request can reach Neon.

**Day 1 deliverable:** a live, server-backed website on a Vercel hostname, with no custom domain
and no paid API requests.

### Day 2 — Android PWA and first test

1. The PWA manifest and 192×192/512×512 icons are now in the repo. Verify them against the
   installed Next.js App Router convention after deploying to HTTPS; they use the existing goat logo.
2. Keep PWA caching conservative. The app stores authenticated attempts and answer keys on the
   server; do not cache API responses or test answers in a service worker. Online access is needed.
3. Open the deployed URL in Android Chrome, install it from Chrome's menu, and confirm the app
   launches without browser chrome. Use BrowserStack's real Android device session or a physical
   Android phone. Check 360–430 px widths, keyboard input, timers, refresh/resume, dark mode, and
   sign-in return flow.
4. Review and publish one bank to prove the full route. Test 1 is a good first candidate because
   all 147 questions have `audit_passed`; it still needs 147 human review marks because none of
   the current files are marked `reviewed`. Use `npm run content:review -- content/test-1.json`,
   save the reviewed download, then `npm run content:import -- content/test-1.reviewed.json --publish`.
5. Leave tests 2–12 in preparation unless there is time to review them. Tests 3, 5, and 7 need 49
   generated-only questions resolved before the existing import gate will accept them. Tests
   13–18 remain placeholders.

**Day 2 deliverable:** installable Android PWA plus one published practice test if its review is
complete. If review is not complete, the PWA and Study library still work while tests remain
unpublished.

### Day 3 — product checks and release

1. Sign in/out, complete a lesson, verify progress persists, start a test, save answers, refresh,
   finish both adaptive routes, and inspect the score report. Check owner-only review moderation.
2. Run the local verification commands below, inspect GitHub Actions and Dependabot results, and
   fix release-blocking issues. Back up the Neon data and the local ignored `content/` directory.
3. Reinstall the PWA from the production URL on a second Android device or browser profile. Verify
   a new deployment updates the PWA when online. Publish only the tests whose content is ready.
4. Confirm the site only says “Free to use; no subscription,” not “Free forever,” so it does not
   promise that third-party hosting quotas can never change. Keep the score notice that SAT score
   estimates are provisional and uncalibrated.
5. Share the Vercel URL and Android “Install app” instructions. Do not submit to Google Play in
   this no-spend sprint.

**Day 3 deliverable:** public beta website and installable Android PWA, with authentication,
progress, lessons, and at least one published test. Roll out additional tests as they pass review.

### If all 12 tests must be live by Day 3

That is a different release decision from a standard reviewed launch. The current importer
requires both `audit_passed` and `reviewed` on every question; all 1,764 questions currently have
`reviewed=false`, and 49 questions in tests 3, 5, and 7 lack the audit flag. At 30 seconds per
question, a full human review would take about 14.7 hours; a careful review will likely take
longer. The no-spend alternative is an explicit **practice beta** import mode that checks the
complete schema/blueprint, leaves audit fields absent, and labels the questions as generated beta
content. It must not silently set `reviewed=true` or `audit_passed=true`. If you choose that path,
we should implement the beta import and visible in-app label before publishing all 12.

## Android distribution without spending

The three-day target is a PWA installed from HTTPS in Chrome, not a Play Store listing. Next.js
supports a manifest from `app/manifest.ts`, and Android browsers can install a PWA from its
manifest and HTTPS origin without app-store approval. This is a working Android app experience,
though the code runs in the browser. If distributing a native APK to a small pilot is important,
Android Developer Console's free limited-distribution account allows up to 50 authorized devices;
it requires a Google account, 2-Step Verification and a Google payments profile, and only allows
new package names that have never been seen on Android. A public Google Play listing instead has
a $25 one-time developer registration fee. See the [Next.js PWA guide], [limited-distribution
account rules], and [Google Play registration fee].

## No-spend launch checklist

- [ ] `DATABASE_URL` and `ADMIN_EMAILS` are configured locally and in Vercel; no secrets are in Git.
- [ ] Neon Free and Supabase Free are within quota; no paid plan or metered AI is enabled.
- [ ] Vercel project uses Hobby only while the project is non-commercial.
- [ ] HTTPS production site loads, Google OAuth works, and a Neon-backed save is durable.
- [ ] PWA manifest/icons validate and Android Chrome installs and launches in standalone mode.
- [ ] At least one content bank is reviewed and imported, or every live test is clearly labeled beta.
- [ ] `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` pass before sharing.
- [ ] Students can report question errors; scores are labeled estimates, not official SAT results.
- [ ] No custom domain, Play Console full distribution, OpenRouter requests, paid AI, ads, or billing.

## Reference setup instructions

The remaining sections are the detailed setup and migration reference. Use them for the matching
Day 1–3 task above. The question-generation commands later in this file can make paid OpenRouter
requests; do not run them as part of this zero-dollar launch plan.

The visual theme is white, signature bright purple (#7628ED), and deep-purple accents. Jerry is a
small animated emoji-style goat. Motion respects reduced-motion preferences.

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
- [GitHub Student Developer Pack](https://education.github.com/pack)
- [GitHub Education student benefits](https://docs.github.com/en/education/about-github-education/github-education-for-students/about-github-education-for-students)
- [Copilot Student setup](https://docs.github.com/en/copilot/how-tos/copilot-on-github/set-up-copilot/enable-copilot/set-up-for-students)
- [Copilot plans and AI-credit limits](https://docs.github.com/en/copilot/get-started/plans)
- [GitHub Actions billing and included usage](https://docs.github.com/en/actions/concepts/billing-and-usage)
- [GitHub security features by repository visibility](https://docs.github.com/en/code-security/getting-started/github-security-features)
- [Vercel Hobby eligibility and limits](https://vercel.com/docs/plans/hobby)
- [Neon Free plan](https://neon.com/pricing)
- [Supabase pricing](https://supabase.com/pricing)
- [Next.js PWA guide](https://nextjs.org/docs/app/guides/progressive-web-apps)
- [Android limited distribution](https://support.google.com/android-developer-console/answer/17131204)
- [Google Play registration fee](https://support.google.com/googleplay/android-developer/answer/6112435)

These references were checked for the handoff; dashboard labels and provider policies may change.

[Vercel Hobby terms]: https://vercel.com/docs/plans/hobby
[Neon Free plan]: https://neon.com/pricing
[Supabase Free plan]: https://supabase.com/pricing
[Android distribution options]: https://support.google.com/android-developer-console/answer/17131204
[current Student Developer Pack]: https://education.github.com/pack
[GitHub Pages limits]: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
[Next.js deployment options]: https://nextjs.org/docs/app/getting-started/deploying
[Next.js PWA guide]: https://nextjs.org/docs/app/guides/progressive-web-apps
[Android Developer Console choices]: https://support.google.com/android-developer-console/answer/17131204
[limited-distribution account rules]: https://support.google.com/android-developer-console/answer/17131204
[Google Play registration fee]: https://support.google.com/googleplay/android-developer/answer/6112435

## Database capacity and themes

As checked on October 26, 2026, [Neon Free](https://neon.com/pricing) lists 1 GB of database storage per project and 100 CU-hours (compute usage) monthly per project. Store lesson text and question JSON in Neon, not the book PDFs. Monitor the dashboard: free storage and compute are finite and terms can change. Using Neon does not replace Vercel hosting.

The moon/sun button switches between solid light and dark themes. The setting is saved in the visitor's browser; first visits follow the device preference. Bright purple #7628ED is the signature action color. Jerry remains a simple animated goat-head image. The timed exam uses its own legible exam surface.

## Handoff limits

The local source, generators and migration tools are provided. No paid generation, production deployment, or live database transfer has been performed as part of this update. Supply your real service settings, run the migration only if needed, and complete docs/LAUNCH-CHECKLIST.md. Eighteen published tests require eighteen fully generated and independently reviewed banks. AI-generated difficulty and provisional scores cannot be promised identical to the official SAT.
