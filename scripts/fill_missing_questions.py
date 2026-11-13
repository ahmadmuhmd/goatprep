"""GOATPrep: fill the missing questions in incomplete test banks.

This file does NOT contain a second copy of the algorithm. It imports generate_questions.py
(same folder) and calls its own generate() function, so every prompt, blueprint slot, local
check, independent-solver gate, repair step, editor gate, budget reservation and resume rule is
exactly the one that produced the existing questions. Because the prompts, models, slots and
reference file feed the generator's configuration fingerprint, a checkpoint saved by
generate_questions.py is recognised and continued, not discarded.

What this file adds around that algorithm:
  * finds the gaps itself by comparing each test-N.json with the blueprint (nothing is hard-coded),
  * refuses to touch a bank that the original generator would also refuse (blueprint mismatch,
    invalid records) and warns before it would regenerate questions that lack audit_passed,
  * backs up test-N.json before writing,
  * continues to the next test if one test stops (budget, rejection cap, provider outage),
  * afterwards confirms questions are in blueprint order and runs the full 147-question check.

Usage (from the project folder, Python 3.10+, standard library only):

    py scripts/fill_missing_questions.py --status
    py scripts/fill_missing_questions.py --tests 3 7 12 --budget 2 --max-tokens 3000
    py scripts/fill_missing_questions.py --tests 5 --budget 2.5 --raise-budget-cap

Running it with no arguments (VS Code "Run Python File") shows the status table and asks what to do.
"""
import argparse
import hashlib
import json
import math
import os
import shutil
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
try:
    import generate_questions as gq
except ImportError:
    sys.exit("generate_questions.py must be in the same folder as fill_missing_questions.py.")

TOTAL = 147

# --- observer only: report WHICH stage hit its token cap. The exception is re-raised unchanged, ---
# --- so the feedback text that the generator passes to the next candidate is not altered.      ---
_original_call = gq.Client.call


def _call_with_stage_report(self, model, system, prompt, max_tokens, stage, temperature=0.2):
    try:
        return _original_call(self, model, system, prompt, max_tokens, stage, temperature)
    except ValueError as exc:
        if "Incomplete model output" in str(exc):
            print(f"  [{stage}] {model} stopped at its {max_tokens}-token output cap "
                  f"({'--max-tokens' if stage in ('author', 'repair') else '--solver-max-tokens' if stage == 'solver' else '--editor-max-tokens'} controls this).")
        raise


gq.Client.call = _call_with_stage_report


# ----------------------------------------------------------------------------- status

def read_json(path, default):
    try:
        return json.loads(Path(path).read_text(encoding="utf-8"))
    except FileNotFoundError:
        return default


def ranges(numbers):
    out = []
    for n in sorted(numbers):
        if out and n == out[-1][1] + 1:
            out[-1][1] = n
        else:
            out.append([n, n])
    return ",".join(str(a) if a == b else f"{a}-{b}" for a, b in out)


def inspect(number, folder):
    """Compare one saved bank with its blueprint. Makes no network request."""
    slots = gq.blueprint(number)
    bank = read_json(folder / f"test-{number}.json", [])
    info = {"number": number, "slots": slots, "bank": bank, "problems": []}
    errors = gq.validate_bank(bank)
    if errors:
        info["problems"].append("Existing bank failed validation: " + "; ".join(errors[:3]))
    allowed = {s["id"]: s for s in slots}
    if not errors:
        for q in bank:
            slot = allowed.get(q["id"])
            if (not slot or any(q.get(k) != slot[k] for k in ("module", "position", "domain", "skill", "difficulty", "scored"))
                    or ("mcq" if q["options"] else "spr") != slot["format"]):
                info["problems"].append(f"{q['id']} does not match the current blueprint "
                                        "(bank came from a different blueprint; use a separate --output folder)")
                break
    by_id = {q["id"]: q for q in bank if isinstance(q, dict) and "id" in q}
    info["accepted"] = [s for s in slots if by_id.get(s["id"], {}).get("audit_passed")]
    info["unaudited"] = [s["id"] for s in slots if s["id"] in by_id and not by_id[s["id"]].get("audit_passed")]
    info["missing"] = [s for s in slots if not by_id.get(s["id"], {}).get("audit_passed")]
    ledger = read_json(folder / f"test-{number}.budget.json", {})
    info["reserved"] = float(ledger.get("reserved", 0) or 0) if isinstance(ledger, dict) else 0.0
    info["checkpoint"] = read_json(folder / f"test-{number}.checkpoint.json", {})
    return info


def describe_missing(info):
    by_module = {}
    for s in info["missing"]:
        by_module.setdefault(s["module"], []).append(s["position"])
    return "; ".join(f"{m} {ranges(p)} ({len(p)})" for m, p in by_module.items())


def print_status(infos, budget=None):
    print(f"{'Test':<6}{'Saved':>9}  Missing slots")
    for info in infos:
        n_ok = len(info["accepted"])
        gaps = describe_missing(info) if info["missing"] else "complete"
        print(f"{info['number']:<6}{f'{n_ok}/{TOTAL}':>9}  {gaps}")
    for info in infos:
        if not info["missing"] or (not info["accepted"] and not info["reserved"]):
            continue   # complete, or not started: nothing worth detailing
        n = info["number"]
        lines = []
        for problem in info["problems"]:
            lines.append("PROBLEM: " + problem)
        if info["unaudited"]:
            lines.append(f"{len(info['unaudited'])} saved question(s) lack audit_passed; generate_questions.py would "
                         "regenerate them (this tool skips the test unless --regenerate-unaudited is given).")
        cp = info["checkpoint"] if isinstance(info["checkpoint"], dict) else {}
        if cp.get("id"):
            rejected = cp.get("rejected_candidates", 0)
            note = f"checkpoint at {cp['id']}"
            if rejected:
                note += f", {rejected} rejected candidate(s)"
            if cp.get("last_feedback"):
                note += f"; last feedback: {str(cp['last_feedback'])[:110]}"
            if rejected >= gq.MAX_REJECTED_CANDIDATES:
                note += "  -> reached the cap; use --retry-rejected-slot"
            lines.append(note)
        reserved = info["reserved"]
        cap = budget if budget else gq.MAX_TEST_BUDGET
        remaining = max(0.0, cap - reserved)
        text = f"reserved ${reserved:.2f} so far; ${remaining:.2f} left under a ${cap:.2f} ceiling"
        if info["accepted"] and reserved:
            per_item = reserved / len(info["accepted"])
            projected = per_item * len(info["missing"])
            text += (f". Rough projection: ~${projected:.2f} more at this test's average of ${per_item:.3f}/question"
                     " (Math items use the R1 solver and may cost more)")
            if projected > remaining:
                text += "  ** likely NOT enough headroom; see --raise-budget-cap **"
        lines.append(text)
        print(f"\nTest {n}:")
        for line in lines:
            print("  " + line)


# ----------------------------------------------------------------------------- run

def post_check(number, folder):
    """Confirm retained questions are untouched, order matches the blueprint, and run the full check."""
    path = folder / f"test-{number}.json"
    slots = gq.blueprint(number)
    bank = read_json(path, [])
    present = {q["id"] for q in bank}
    expected_order = [s["id"] for s in slots if s["id"] in present]
    if [q["id"] for q in bank] != expected_order:
        order = {s["id"]: i for i, s in enumerate(slots)}
        bank.sort(key=lambda q: order[q["id"]])
        gq.atomic_json(path, bank)
        print(f"Test {number}: re-sorted the bank into blueprint order.")
    complete = len(bank) == TOTAL and all(q.get("audit_passed") for q in bank)
    errors = gq.validate_bank(bank, complete=complete)
    if errors:
        print(f"Test {number}: VALIDATION PROBLEMS: " + "; ".join(errors[:5]))
        return False
    if complete:
        print(f"Test {number}: complete ({TOTAL}/{TOTAL}), in blueprint order, passes the full-bank check "
              "(domain targets, 33 MCQ + 11 SPR per Math route, 54/44 per route).")
    else:
        print(f"Test {number}: {len(bank)}/{TOTAL} saved, in blueprint order.")
    return complete


def resolve_examples(path):
    if not path.exists():
        original = Path("G:/Other computers/HP/sat-simulator/extracted_sat_items.json")
        if path == gq.ROOT / "content/reference-examples.json" and original.exists():
            return original
        raise RuntimeError("Example JSON not found. Supply --examples PATH_TO_JSON.")
    return path


def build_parser():
    p = argparse.ArgumentParser(description="Fill missing questions using generate_questions.py's own algorithm.")
    p.add_argument("--tests", type=int, nargs="+", help="Test numbers 1-18 (default: every incomplete test)")
    p.add_argument("--status", action="store_true", help="Show gaps and budget headroom only; no network, no cost")
    p.add_argument("--budget", type=float, help="Cumulative USD ceiling per test (the original maximum is 2.00)")
    p.add_argument("--raise-budget-cap", action="store_true",
                   help="Allow --budget above the original $2.00 per-test maximum (your explicit decision)")
    p.add_argument("--regenerate-unaudited", action="store_true",
                   help="Also regenerate saved questions that lack audit_passed (spends money; off by default)")
    p.add_argument("--draft-model", default=os.getenv("OPENROUTER_MODEL") or gq.DEFAULTS[0])
    p.add_argument("--audit-model", default=os.getenv("OPENROUTER_AUDIT_MODEL") or gq.DEFAULTS[1],
                   help="Solver for Reading & Writing")
    p.add_argument("--editor-model", default=os.getenv("OPENROUTER_EDITOR_MODEL") or gq.DEFAULTS[2])
    p.add_argument("--math-audit-model", default=os.getenv("OPENROUTER_MATH_AUDIT_MODEL") or gq.DEFAULTS[3],
                   help="Solver for Math")
    p.add_argument("--max-tokens", type=int, default=3000, help="Author/repair output cap (original default 1800)")
    p.add_argument("--solver-max-tokens", type=int, default=5000)
    p.add_argument("--editor-max-tokens", type=int, default=600)
    p.add_argument("--limit", type=int, default=TOTAL, help="Maximum NEW accepted items per test in this run")
    p.add_argument("--retry-rejected-slot", action="store_true",
                   help="Grant a slot that hit the rejection cap up to 9 more candidates")
    p.add_argument("--examples", type=Path, default=gq.ROOT / "content/reference-examples.json")
    p.add_argument("--output", type=Path, default=gq.ROOT / "content")
    return p


def main(argv=None):
    gq.load_env()
    argv = sys.argv[1:] if argv is None else argv
    parser = build_parser()
    args = parser.parse_args(argv)
    folder = args.output

    interactive = not argv
    if interactive:
        infos = [inspect(n, folder) for n in range(1, 19)]
        print_status([i for i in infos if i["missing"]] or infos)
        incomplete = [i["number"] for i in infos if i["missing"]]
        if not incomplete:
            print("\nEvery test is complete.")
            return 0
        answer = input(f"\nTests to fill [{' '.join(map(str, incomplete))}]: ").strip()
        args.tests = [int(x) for x in answer.replace(",", " ").split()] if answer else incomplete
        args.budget = float(input("Total spending ceiling in USD per test [2.00]: ").strip() or "2.00")

    tests = args.tests or [n for n in range(1, 19) if inspect(n, folder)["missing"]]
    if any(not 1 <= n <= 18 for n in tests):
        parser.error("Test numbers must be 1-18")

    if args.status:
        print_status([inspect(n, folder) for n in (args.tests or range(1, 19))], args.budget)
        return 0

    if args.budget is None:
        parser.error("Supply --budget (cumulative USD ceiling per test), or use --status.")
    if not math.isfinite(args.budget) or args.budget <= 0:
        parser.error("--budget must be greater than 0")
    if args.budget > gq.MAX_TEST_BUDGET:
        if not args.raise_budget_cap:
            parser.error(f"--budget above ${gq.MAX_TEST_BUDGET:.2f} needs --raise-budget-cap "
                         "(the original generator's per-test maximum).")
        gq.MAX_TEST_BUDGET = args.budget   # read by gq.Client at construction time
    if args.max_tokens < 1000 or args.solver_max_tokens < 1 or args.editor_max_tokens < 1 or args.limit < 1:
        parser.error("max-tokens >=1000, solver/editor token caps >=1 and limit >=1 required")

    models = [args.draft_model, args.audit_model, args.editor_model, args.math_audit_model]
    key = os.getenv("OPENROUTER_API_KEY") or gq.legacy_key()
    if not key:
        parser.error("Set OPENROUTER_API_KEY in .env.local; no key was found in the old script either.")

    # Preflight on local files only, before any network access.
    work = []
    for n in tests:
        info = inspect(n, folder)
        if not info["missing"]:
            print(f"Test {n}: already complete, nothing to do.")
            continue
        if info["problems"]:
            print(f"Test {n}: skipped. " + " ".join(info["problems"]))
            continue
        if info["unaudited"] and not args.regenerate_unaudited:
            print(f"Test {n}: skipped. {len(info['unaudited'])} saved question(s) lack audit_passed and would be "
                  "regenerated (and paid for). Re-run with --regenerate-unaudited if that is intended.")
            continue
        if info["reserved"] >= args.budget:
            print(f"Test {n}: skipped. ${info['reserved']:.2f} is already reserved, which meets the ${args.budget:.2f} "
                  "ceiling. Raise --budget (above $2.00 also needs --raise-budget-cap).")
            continue
        work.append(info)
    if not work:
        return 0

    refs = gq.References(resolve_examples(args.examples))
    print("Example filtering:", json.dumps(refs.report))
    print("Algorithm source: generate_questions.py sha256 "
          + hashlib.sha256(Path(gq.__file__).read_bytes()).hexdigest()[:12])
    catalog = gq.fetch_catalog()

    outcome = {}
    for info in work:
        n = info["number"]
        print(f"\n=== Test {n}: filling {len(info['missing'])} slot(s): {describe_missing(info)} ===")
        bank_path = folder / f"test-{n}.json"
        if bank_path.exists():
            backup = bank_path.with_name(bank_path.name + ".bak-" + time.strftime("%Y%m%d-%H%M%S"))
            shutil.copy2(bank_path, backup)
            print(f"Backup: {backup.name}")
        ns = argparse.Namespace(
            test=n, budget=args.budget, max_tokens=args.max_tokens, solver_max_tokens=args.solver_max_tokens,
            editor_max_tokens=args.editor_max_tokens, limit=args.limit,
            retry_rejected_slot=args.retry_rejected_slot, references_obj=refs)
        try:
            with gq.GenerationLock(folder / f"test-{n}.generation.lock"):
                gq.generate(ns, gq.blueprint(n), models, catalog, key, folder)
        except (RuntimeError, OSError, ValueError) as error:
            print(f"STOP (test {n}): {error}", file=sys.stderr)
        outcome[n] = post_check(n, folder)

    print("\nSummary")
    for n, done in outcome.items():
        print(f"  Test {n}: {'complete' if done else 'still incomplete; rerun the same command to resume'}")
    if any(outcome.values()):
        print("\nNext, for each completed test (the generator never publishes automatically):")
        print("  npm run content:validate -- content/test-N.json")
        print("  npm run content:review   -- content/test-N.json")
        print("Then review every question, including the newly added ones, which are saved with reviewed=false.")
    return 0 if outcome and all(outcome.values()) else 1


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\nStopped safely. Run the same command to resume from the last saved stage.")
        print("A request interrupted before its response was saved may need to be repeated; its budget reservation is retained.")
        sys.exit(130)
    except (RuntimeError, OSError, ValueError) as error:
        print("STOP:", str(error), file=sys.stderr)
        sys.exit(1)