# Run or resume the single-file SAT question generator

All prompts, skill guidance, reference selection, test assembly, checks and resume logic
are inside **scripts/generate_questions.py**. No separate prompt file, pip package or
Node.js installation is needed for question generation. Python 3.10+ is sufficient.
The website still needs Node.js for development, review/import commands and deployment.

## Run it in VS Code

Open C:\sat-simulator in VS Code. Open scripts/generate_questions.py and click
**Run Python File in Terminal**. It asks for:
1. The test number, from 1 to 18.
2. Your total spending ceiling in US dollars for that test.

Or use a terminal command:

```powershell
py scripts/generate_questions.py --test 1 --budget 2 --use-legacy-key
```

The example ceiling is not a price estimate. Choose your own ceiling up to $2 per test.
`--budget` is a cumulative reservation ceiling for that test, not an amount the script
will automatically spend. It can pause below the ceiling when the next request's
conservative reservation will not fit in the remaining balance. Raising the ceiling allows
more requests; it does not itself spend the difference. The console distinguishes token-cost
estimates from cumulative reservations. A provider-side spending cap is needed to limit
actual account billing independently of this local estimate.
The script automatically reads your existing key from the archived original script
if OPENROUTER_API_KEY is absent. It does not execute the old script or print the key.
The --use-legacy-key flag is retained for compatibility but is no longer necessary.
If you move the generator to another computer, put your existing key in .env.local:

```dotenv
OPENROUTER_API_KEY=YOUR_EXISTING_KEY
OPENROUTER_MODEL=deepseek/deepseek-chat
OPENROUTER_AUDIT_MODEL=deepseek/deepseek-r1-0528
OPENROUTER_EDITOR_MODEL=google/gemini-3.7-flash
```

These preserve the original DeepSeek draft/reasoning and Gemini final-review pipeline.
The old exact deepseek/deepseek-r1 ID was unavailable at the last catalog check;
the script defaults to the available R1-0528 variant. An environment variable overrides
that default. No model is silently substituted if your chosen ID becomes unavailable.

Check models without spending generation credits:
```powershell
py scripts/generate_questions.py --check-models
```

## Your example JSON is connected

Your supplied file was inspected and copied privately to:
content/reference-examples.json

Original:
G:\Other computers\HP\sat-simulator\extracted_sat_items.json

There are 5,940 extracted records. Initial filtering retained 900 digital-style candidates,
removed 1,484 duplicate records, and filtered 3,556 other records. These are extraction
records, not a claim that 900 fully verified questions exist.

For each assigned skill, the script selects up to two matching digital-era examples.
It excludes older paper-format material, recognizable answer pages, very long/short
chunks and obvious missing-visual references. This filtering is heuristic and can miss
OCR problems, so examples are explicitly treated as untrusted style data—not instructions
or answer keys. The model must write a new question, not copy or change names/numbers.
A verbatim-overlap check catches long copied spans; human originality review is still needed.

To use another JSON:
```powershell
py scripts/generate_questions.py --test 1 --budget 2 --examples "G:\Other computers\HP\sat-simulator\extracted_sat_items.json"
```

Selected excerpts are sent to your configured OpenRouter models as part of generation.
Reference JSON is kept outside public/ and is not included in the website source ZIP.
If you move the script elsewhere, supply --examples and place .env.local beside it.

## Preview first without spending anything

```powershell
py scripts/generate_questions.py --test 1 --dry-run
```

Open content/test-1.plan.json. It includes every assigned slot, domain counts, response types,
target difficulty counts, filtering statistics, and a sample prompt with selected examples.
This command makes no network requests.

For just three new accepted questions:
```powershell
py scripts/generate_questions.py --test 1 --budget 2 --limit 3 --use-legacy-key
```

## Stop and restart

Press Ctrl+C to stop. Later run the same command again, using the same test number and
output folder. Already accepted questions are not regenerated.

The script saves:
- test-1.json: accepted questions, one saved immediately after each final approval.
- test-1.checkpoint.json: the current draft, independent audit and editorial result,
  each written as soon as it arrives, plus the latest rejection feedback for the next
  candidate when generation is correcting a slot.
- test-1.budget.json: cumulative reservations, including interrupted/failed calls.
- test-1.generation.json: progress, model settings and blueprint summary.
- test-1.generation.lock: a persistent lock file; its existence does NOT block restarting.

The operating system releases the lock automatically when the process exits, even when
VS Code is closed or the process is killed. You do not need to delete the lock file.
A second simultaneous generator for the same test is blocked.

If you stop during the editorial call, the saved draft and independent audit are reused.
If a request had reached the provider but its response was not yet saved, that single
request may repeat and may cost credits again. No client can recover an unreceived response.
Its earlier budget reservation remains, so restarts do not erase spending.
Transient provider errors such as HTTP 429 rate limits and 504 timeouts, plus transport
failures such as a Windows socket reset (including WinError 10054), are retried as the same
author, solver or editor request. Backoff starts at 10 seconds and doubles, capped at 120
seconds; when the provider supplies `Retry-After`, that delay is honored up to the same cap.
Each request gets up to three attempts, and a transient failure does not count as a rejected
question candidate. If the provider remains unavailable, generation stops with the current
checkpoint saved; rerun the same command after access recovers. Because a reset can happen
after the provider accepted a request, the budget ledger conservatively reserves cost for
each retry; returned usage reconciles the latest attempt when available.

Each slot has fixed module, domain, skill, difficulty, response format and scored/unscored
attributes. The generator tries candidates in batches of three. If a batch fails, it
automatically starts another batch for that same slot, using the rejection feedback and
rotating reference examples. It does not move on until that slot passes. This continues until
the item passes or the cumulative spending ceiling is reached. Accepted questions stay saved.
If you stop the process, rerun the same command to resume.
When local validation, the independent solver, or the editor identifies a repairable defect,
the author model receives the draft and specific feedback and may return a corrected full
item up to twice for that candidate. Every repaired item goes through local checks and a fresh
blind solver pass; editorial approval is then repeated. Repairs never bypass either quality
gate. Failed repairs count as a rejected candidate, and their cost appears under the `repair`
stage in the ledger.
For skills that use a word or punctuation gap, the generator requires a six-underscore
marker (`______`) and rejects the literal word "blank" locally before paying for solver
and editor calls.
Modifier questions must test modifier placement or attachment. The generator rejects
modifier items whose four choices are only conjunctions or transitions, such as "and"/"so".
For student-produced responses, the answer must be a signed integer, decimal, or simple
fraction (for example, `-3`, `0.75`, or `3/4`) with no units, commas, currency, or math markup.
SPR prompts that ask the student to choose an option are rejected locally. When a candidate
fails, its text is supplied to the next author attempt as untrusted data so the model can
correct the issue or avoid repeating a duplicate with only cosmetic changes.
Sentence-boundary items use a constrained form: an introductory dependent clause, four
punctuation-only options (comma, semicolon, period, colon), and the comma key. The local
check rejects word-filled choices before paying for solver/editor review.

A changed model, prompt, example file or blueprint causes a saved author draft to be checked
again under the current rules; any saved solver/editor results are cleared. If no draft was
saved, the unfinished item restarts at authoring. Completed accepted questions remain saved.
They still require human review.
If generation stops at the ceiling, the error now shows the reservation already held, the
reservation required by the next request, and the remaining balance. Resume with the same
ceiling if you want it to stop at the same point, or explicitly raise --budget to a higher
TOTAL amount to allow more requests. Keep a provider-side spending cap too; local token-cost
estimates and reservations are not a billing guarantee.

Do not run the old generator simultaneously against the same test file.

## What matches the SAT—and what cannot be promised

Each student receives 54 Reading & Writing and 44 Math questions, in four timed modules.
Each stored test has 147 questions to include both second-module branches.
Each administered module includes two unscored trial slots, blended into question order.

For either Reading & Writing route, the 50 scored questions contain:
- 14 Craft and Structure
- 13 Information and Ideas
- 13 Standard English Conventions
- 10 Expression of Ideas

For either Math route, the 40 scored questions contain:
- 14 Algebra
- 14 Advanced Math
- 6 Problem-Solving and Data Analysis
- 6 Geometry and Trigonometry

The generator checks both second-module routes against these counts before it builds a plan
and again before it accepts a complete bank. Each route also has 4 unscored trial slots.
The full Math route, including trials, must contain 33 multiple-choice and 11 student-
produced-response questions. The dry-run plan records these counts for both routes.

Each full Math sitting has 33 multiple-choice and 11 student-produced-response questions.
Reading & Writing uses four-choice MCQs throughout.
Similar reading skills are grouped; Math is ordered by target difficulty.
First modules mix difficulty levels; second modules have lower/higher average targets.

These implement the published domain targets and format proportions.
College Board publishes approximate proportions and ranges, not a universal exact form.
The local skill rotation and easy/medium/hard labels are design choices, not official quotas
or measured difficulty. Exact official difficulty and score equivalence require empirical
calibration with students. Text-only practice also cannot match visual-question types.
Do not advertise these as official tests or guaranteed identical-difficulty tests.

Reference: [College Board Digital SAT Specifications Overview](https://satsuite.collegeboard.org/media/pdf/digital-sat-test-spec-overview.pdf).

## Review and publish

When all 147 questions are accepted:
```powershell
npm run content:validate -- content/test-1.json
npm run content:review -- content/test-1.json
```

Open content/test-1.review.html. Independently solve and check each question, explanation,
difficulty and originality. Approve each item only after checking it. Download the reviewed
JSON and move it to content/test-1.reviewed.json.

```powershell
npm run content:validate -- content/test-1.reviewed.json --reviewed
npm run content:import -- content/test-1.reviewed.json --publish
```

The generator does not publish automatically.
Continue with GOATPrep-START-TO-PUBLISH.md for Neon, Google login and deployment.

## Existing banks from the earlier generator

The revised blueprint changes question ordering and some formats/skills.
It refuses to silently mix old-bank questions with the new blueprint.
Preserve any earlier bank and use a new output folder:

```powershell
py scripts/generate_questions.py --test 1 --budget 2 --output content-v2 --use-legacy-key
```

Use content-v2 in the review/import commands too.
Do not replace a published test that already has student attempts.

## Files and verification

The standalone script includes the detailed prompts near its top; edit them there if needed.
The website's scripts/blueprint.mjs is synchronized with the embedded Python blueprint.
Tests compare all 18 plans and verify that a complete Python bank passes website validation.
Offline tests also cover saved-stage recovery, killed-process lock recovery, duplication
filtering, spending limits, answer disagreement and missing models.
No paid generation was run while preparing this update.
