# Cleanup record

Original code is preserved in backups/before-goatprep/. This backup includes old scripts with old credentials; keep it private.

Removed from active project:
- sat_pipeline/input_pdfs: all 55 PDFs matched input_pdfs byte-for-byte before deletion.
- sat_generator and sat_pipeline legacy scripts: backed up first.
- finalized_one_sat.py, seed.py, index.html: backed up first, superseded by scripts/.
- Python __pycache__: regenerated data.
- Five unused Next.js starter SVG assets.

Retained:
- input_pdfs: canonical reference PDF collection.
- archive/legacy-questions.json: old 144-item question file, not approved for publication.
- archive/extracted_sat_items.json: raw historical extraction, not a clean bank.
- .tmp.driveupload: contains nonempty Drive temporary files; intentionally not deleted without understanding their sync state.
- .tmp.drivedownload: untouched sync directory.
- .env.local: existing configuration preserved.
- AGENTS.md and CLAUDE.md: repository instructions preserved.

No live database was mutated and no paid generation was run.
