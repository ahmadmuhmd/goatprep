# Generate and publish the Study library

Run these commands in VS Code's terminal, inside the GOATPrep folder. Use Python 3.10 or newer. Replace `py` with `python` if needed.

## 1. Install the PDF and database libraries

```powershell
py -m pip install -r scripts/requirements-study.txt
```

The separate `scripts/generate_study_resources.py` contains its own prompts, source selection, checks, and resume logic. The question generator is not required to run it.

## 2. Prepare your PDFs and settings

Keep the books in a private folder, outside `public/`. The default is `C:\SAT-SIMULATOR-FILES\simulator-files`. Set `OPENROUTER_API_KEY` in `.env.local`; the script can also read the archived original generator's key on this computer. It uses the same draft, independent solver, and editor models as the question generator. See GENERATE-QUESTIONS.md for overrides.

These are reference books for producing original explanations and examples. Do not publish the PDFs or reconstructed chapters. Selected short extracts are sent to your configured OpenRouter providers. Inspect the outputs for accuracy and originality before approving them.

## 3. Extract and inspect the lesson plan — no API credits

```powershell
py scripts/generate_study_resources.py --index --pdf-dir "C:\SAT-SIMULATOR-FILES\simulator-files"
py scripts/generate_study_resources.py --plan
```

Read `content/study/pdf-index.json` for extraction results and `study-plan.json` for topic coverage and selected PDF pages. Page numbers refer to the actual PDF page, not the printed number. Source matching is a search heuristic: inspect the selected pages, especially topics with sparse coverage. Chapters with charts may need additional explanation; generated lessons and quizzes must work without images.

Six supplied PDFs yielded readable text during preparation. Two grammar scans had no extractable text. To use those scans, first apply OCR (software that converts scanned page images into text), then index the searchable PDFs again. Other readable grammar references can be used without those scans.

## 4. Generate a small batch, then resume

```powershell
py scripts/generate_study_resources.py --generate --budget 5 --limit 3
```

Five dollars is an example total spending ceiling, not an expected cost. The script reserves estimated request costs, saves accepted lessons immediately, and checkpoints each draft/audit/editor stage. Press Ctrl+C to stop. Run the same command with the same output folder to continue. Remove `--limit 3` to work through the remaining topics. `--topic "quadratic"` restricts the batch to matching topics.

The budget is cumulative for the output folder. Raise it explicitly if needed; restarting does not reset it. An API response lost during interruption may require a repeated paid request. Keep a provider-side spending limit too.

## 5. Review the material

```powershell
py scripts/generate_study_resources.py --review content/study/study-drafts.json
```

Open `content/study/study-drafts.review.html` in your browser. Check every explanation, worked solution, quiz option, correct answer, and source page. Tick approval only for lessons you checked. Download `study-reviewed.json` and move it into `content/study/`.

The UI format is fixed: section, domain, title, summary, concept, ordered method steps, worked example, explanation, and a four-option quiz with feedback. Private source references are stored separately and never sent by the public lessons API. Edited lessons fail the audit hash check; regenerate/re-audit them instead of bypassing that check.

## 6. Publish to Neon

First follow the main guide to create Neon, run `neon/schema.sql`, and set the server-only `DATABASE_URL` in `.env.local`.

```powershell
py scripts/generate_study_resources.py --publish content/study/study-reviewed.json
```

Publication is one database transaction (all lessons succeed together or none are changed). Existing lessons with the same ID are updated. Only reviewed, audited, unchanged lessons are accepted. Open Study again or refocus the browser: `/api/lessons` loads published resources automatically without rebuilding the site. The 16 original foundation lessons remain available if the database is offline.

Keep the index, checkpoints and budget files private. They are excluded from the source ZIP. Back up your generated JSON separately.
