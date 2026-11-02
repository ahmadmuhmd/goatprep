"""Build a source-only handoff ZIP; excludes credentials and generated banks."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parents[1]
target = root / "output/GOATPrep-source.zip"
target.parent.mkdir(exist_ok=True)
folders = ["app", "lib", "types", "public", "scripts", "supabase", "neon", "tests", "docs"]
files = ["package.json", "package-lock.json", "tsconfig.json", "next.config.ts",
         "next-env.d.ts", "postcss.config.mjs", "eslint.config.mjs", ".env.example",
         ".gitignore", "README.md", "SETUP.md", "GOATPrep-START-TO-PUBLISH.md", "GENERATE-QUESTIONS.md", "GENERATE-STUDY.md",
         "AGENTS.md", "CLAUDE.md"]
with ZipFile(target, "w", ZIP_DEFLATED) as archive:
    for folder in folders:
        for path in (root / folder).rglob("*"):
            if path.is_file() and "__pycache__" not in path.parts and path.suffix != ".pyc":
                archive.write(path, path.relative_to(root))
    for name in files:
        path = root / name
        if path.exists():
            archive.write(path, name)
with ZipFile(target) as archive:
    assert archive.testzip() is None
    assert ".env.local" not in archive.namelist()
    assert "scripts/generate_questions.py" in archive.namelist()
    assert "GOATPrep-START-TO-PUBLISH.md" in archive.namelist()
    print(f"Verified {len(archive.namelist())} files: {target}")
