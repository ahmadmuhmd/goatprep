# GOATPrep scoring: what it does and does not mean

The estimator is NOT College Board's scoring algorithm. It is an initial IRT-style model with assumed parameters, not empirically calibrated items. Scores must remain labelled “estimated” and “provisional”.

## Current model

- All administered scored items are included. A blank response is incorrect.
- Two designated trial items in each module are excluded.
- MCQ: exact matching option letter.
- Numeric input: exact string or numerically equivalent finite decimal/fraction with absolute tolerance 1e-9. Units, scientific notation, and commas are rejected. Explicit acceptable rounded answers must be stored in the key.
- An item has assumed discrimination a=1.2 and difficulty b=-1.2, 0, or 1.2.
- Guessing floor c=.2 for MCQ and 0 for numeric response.
- Ability is estimated over a -4 to 4 grid with a standard-normal prior, using log likelihood for stability.
- Routing selects the harder second module when first-module estimated ability is at least 0. This threshold is our assumption.
- Score conversion is round-to-10(500 + 120 × ability), clipped to 200–800.
- There is no invented hard-route minimum or easy-route fixed maximum.
- The scoring version is saved with completed attempts. Historical displayed scores are not recomputed silently.

With uncalibrated parameters, perfect performance need not yield 800. This is an estimator limitation, not an official SAT rule.
The model does not have a validated score error band. Do not add a claim such as “within 20 points”.

## Calibration plan

Recruit a representative pilot group, collect consented response data, and compare estimates against recent official practice results.
Measure item difficulty, discrimination, omissions, ambiguity, and subgroup performance.
Use held-out students to assess error instead of fitting and evaluating on the same students.
Fit individual item parameters and a defensible linking scale. Record the dataset and scoring version.
Remove poorly performing questions and evaluate both adaptive routes.
Publish accuracy claims only after validation supports them.

## Why text-only is different

No diagram interpretation or graphical evidence is tested. Text descriptions and text tables preserve some underlying reasoning but cannot establish identical coverage to the official assessment.

Reference: https://satsuite.collegeboard.org/scores/what-scores-mean/how-scores-calculated
Framework: https://satsuite.collegeboard.org/media/pdf/assessment-framework-for-digital-sat-suite.pdf
