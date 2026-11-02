"""Offline fault injection for both generators. No real provider or database calls."""
import contextlib
import copy
import io
import json
import os
from pathlib import Path
import sys
import tempfile
import types
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import generate_questions as q
import generate_study_resources as s

CATALOG = {"m": {"pricing": {"prompt": "0.000001", "completion": "0.000002"},
                  "supported_parameters": ["response_format", "temperature"]}}


def response(content='{"ok":true}', **overrides):
    value = {"choices": [{"finish_reason": "stop", "message": {"content": content}}],
             "usage": {"prompt_tokens": 10, "completion_tokens": 20}}
    value.update(overrides)
    return io.StringIO(json.dumps(value))


def question(slot):
    passage = "Original context for " + slot["id"]
    if slot["skill"] in q.BLANK_SKILLS:
        passage += ": the result was ______ despite careful observations."
    options = [{"letter": letter, "text": "Distinct phrase " + letter} for letter in "ABCD"]
    if slot["skill"] == "Sentence boundaries":
        passage = "Although the observations for " + slot["id"] + " were limited______ the researchers continued."
        options = [{"letter": letter, "text": mark} for letter, mark in zip("ABCD", [",", ";", ".", ":"])]
    return {"passage": passage, "prompt": "What is the requested result for this situation?",
            "options": options if slot["format"] == "mcq" else [],
            "answer": ["A" if slot["format"] == "mcq" else "4"],
            "explanation": "A complete original explanation for " + slot["id"] + ". Check the result against every condition."}


def lesson(slot):
    return {"title": slot["skill"], "summary": "A practical method for " + slot["skill"],
            "concept": "Read the conditions carefully and use the relevant relationship to determine what follows.",
            "steps": ["Read all the conditions.", "Apply the relationship.", "Check the conclusion."],
            "example": "An original worked example with enough information to determine a single clear conclusion.",
            "explanation": "The conclusion follows from the given conditions; checking those conditions rules out alternatives.",
            "quiz": {"prompt": "Which conclusion is supported?", "options": ["First", "Second", "Third", "Fourth"],
                     "answer": 0, "feedback": "Only the first conclusion follows; the other three contradict the conditions."}}


class Refs:
    digest = "offline-reference-fixture"
    def select(self, slot, salt=0): return []
    def check_original(self, item): pass


class OfflineCase(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.folder = Path(self.temp.name)
        self.addCleanup(patch.stopall)
        patch.object(q, "urlopen", side_effect=AssertionError("Unexpected question network call")).start()
        patch.object(s, "urlopen", side_effect=AssertionError("Unexpected study network call")).start()
        patch.object(q.time, "sleep").start()
        patch("sys.stdout", new=io.StringIO()).start()

    def client(self, module, name="ledger", budget=1, catalog=None):
        args = ("offline", ["m"], catalog or CATALOG, self.folder/(name+".json"), budget)
        return module.Client(*args, 1000) if module is s else module.Client(*args)

    def call(self, module, client):
        return client.call("m", "system", "prompt") if module is s else client.call("m", "system", "prompt", 1000, "author")


class ClientFaultTests(OfflineCase):
    def test_success_reconciles_usage_and_serializes_request(self):
        for module in (q, s):
            with self.subTest(module=module.__name__):
                client = self.client(module, module.__name__)
                with patch.object(module, "urlopen", return_value=response()) as net:
                    self.assertEqual(self.call(module, client), {"ok": True})
                self.assertAlmostEqual(client.ledger["reserved"], .00005)
                self.assertEqual(client.ledger["calls"], 1)
                body = json.loads(net.call_args.args[0].data)
                self.assertEqual(body["response_format"], {"type": "json_object"})
                self.assertEqual(body["max_tokens"], 1000)

    def test_invalid_usage_never_releases_reservation(self):
        for module in (q, s):
            for index, usage in enumerate((None, [], "bad", {}, {"prompt_tokens": -1, "completion_tokens": 0},
                                          {"prompt_tokens": True, "completion_tokens": 0},
                                          {"prompt_tokens": "10", "completion_tokens": 2})):
                with self.subTest(module=module.__name__, usage=usage):
                    client = self.client(module, module.__name__+str(index))
                    with patch.object(module, "urlopen", return_value=response(usage=usage)):
                        self.call(module, client)
                    self.assertGreater(client.ledger["reserved"], .002)

    def test_provider_envelope_failures_are_controlled(self):
        cases = ([], None, {}, {"choices": []}, {"choices": None}, {"choices": [None]},
                 {"error": {"code": 401, "message": "unauthorized"}})
        for module in (q, s):
            for i, value in enumerate(cases):
                with self.subTest(module=module.__name__, value=value):
                    client = self.client(module, module.__name__+str(i))
                    with patch.object(module, "urlopen", return_value=io.StringIO(json.dumps(value))):
                        with self.assertRaises(RuntimeError): self.call(module, client)
                    self.assertGreater(client.ledger["reserved"], 0)

    def test_invalid_provider_json_preserves_reservation(self):
        for module in (q, s):
            client = self.client(module, module.__name__)
            with patch.object(module, "urlopen", return_value=io.StringIO("<html>bad gateway")):
                with self.assertRaisesRegex(RuntimeError, "Malformed provider"): self.call(module, client)
            self.assertGreater(client.ledger["reserved"], 0)

    def test_invalid_model_output_is_a_candidate_failure(self):
        cases = [response("not JSON"), response("[]"), response(""), response(None), response(["text"]),
                 response(choices=[{"finish_reason": "length", "message": {"content": "{}"}}]),
                 response(choices=[{"finish_reason": "stop", "message": None}])]
        # Recreate streams separately for each module.
        raw = [v.getvalue() for v in cases]
        for module in (q, s):
            for i, value in enumerate(raw):
                with self.subTest(module=module.__name__, case=i):
                    client = self.client(module, module.__name__+str(i))
                    with patch.object(module, "urlopen", return_value=io.StringIO(value)):
                        with self.assertRaises(ValueError): self.call(module, client)
                    self.assertAlmostEqual(client.ledger["reserved"], .00005)

    def test_fenced_json_is_accepted(self):
        for module in (q, s):
            with patch.object(module, "urlopen", return_value=response('```json\n{"ok":true}\n```')):
                self.assertTrue(self.call(module, self.client(module, module.__name__))["ok"])

    def test_invalid_ledger_is_not_overwritten(self):
        for module in (q, s):
            for value in ([], None, {}, {"reserved": "0", "calls": 0}, {"reserved": -1, "calls": 0},
                          {"reserved": float("nan"), "calls": 0}, {"reserved": 0, "calls": -1}):
                with self.subTest(module=module.__name__, ledger=value):
                    file = self.folder/"ledger.json"
                    file.write_text(json.dumps(value))
                    before = file.read_bytes()
                    with self.assertRaisesRegex(RuntimeError, "Invalid saved budget"): self.client(module)
                    self.assertEqual(file.read_bytes(), before)

    def test_invalid_budgets_caps_and_prices_block_network(self):
        for module in (q, s):
            for budget in (0, -1, float("nan"), float("inf")):
                with self.subTest(module=module.__name__, budget=budget):
                    with self.assertRaises(RuntimeError): self.client(module, budget=budget)
            for price in ("-1", "nan", "inf"):
                catalog = {"m": {"pricing": {"prompt": price, "completion": "0"}}}
                with self.assertRaises(RuntimeError): self.client(module, catalog=catalog)
            catalog = {"m": {"pricing": {"prompt": "0", "completion": "0", "request": "1"}}}
            with self.assertRaisesRegex(RuntimeError, "Unsupported extra"): self.client(module, catalog=catalog)
        with self.assertRaises(RuntimeError): self.client(q, budget=1.01)
        for cap in (-100, 0, True):
            with self.assertRaises(RuntimeError): self.client(q).call("m", "", "", cap, "author")
            with self.assertRaises(RuntimeError): s.Client("", ["m"], CATALOG, self.folder/"unused", 1, cap)

    def test_budget_blocks_before_network(self):
        for module in (q, s):
            client = self.client(module, module.__name__, budget=.0001)
            with self.assertRaisesRegex(RuntimeError, "[Bb]udget ceiling"): self.call(module, client)

    def test_http_retry_retains_possible_previous_charge(self):
        for status in (429, 500, 502, 503, 504):
            client = self.client(q, str(status))
            error = q.HTTPError("offline", status, "test", {}, io.BytesIO(b"failure"))
            with patch.object(q, "urlopen", side_effect=[error, response()]): self.call(q, client)
            self.assertEqual(client.ledger["calls"], 2)
            self.assertGreater(client.ledger["reserved"], .002)

    def test_transport_failures_retain_all_reservations(self):
        for module in (q, s):
            for i, error in enumerate((q.URLError("offline"), TimeoutError(), ConnectionResetError())):
                client = self.client(module, module.__name__+str(i))
                with patch.object(module, "urlopen", side_effect=error):
                    with self.assertRaises(RuntimeError): self.call(module, client)
                self.assertEqual(client.ledger["calls"], q.MAX_REQUEST_ATTEMPTS if module is q else 1)
                self.assertGreater(client.ledger["reserved"], 0)

    def test_retry_cannot_cross_budget(self):
        client = self.client(q, budget=.003)
        with patch.object(q, "urlopen", side_effect=ConnectionResetError()) as net:
            with self.assertRaisesRegex(RuntimeError, "budget ceiling"): self.call(q, client)
        self.assertEqual(net.call_count, 1)
        self.assertLessEqual(client.ledger["reserved"], .003)

    def test_http_200_transient_error_reconciles_each_attempt(self):
        client = self.client(q)
        failed = {"error": {"code": 503}, "usage": {"prompt_tokens": 5, "completion_tokens": 0}}
        with patch.object(q, "urlopen", side_effect=[io.StringIO(json.dumps(failed)), response()]):
            self.call(q, client)
        self.assertEqual(client.ledger["calls"], 2)
        self.assertAlmostEqual(client.ledger["reserved"], .000055)

    def test_unknown_cost_survives_resume(self):
        for module in (q, s):
            client = self.client(module, module.__name__)
            with patch.object(module, "urlopen", side_effect=KeyboardInterrupt()):
                with self.assertRaises(KeyboardInterrupt): self.call(module, client)
            resumed = self.client(module, module.__name__)
            self.assertEqual(resumed.ledger, client.ledger)
            self.assertGreater(resumed.ledger["reserved"], 0)


class QuestionPipelineTests(OfflineCase):
    def setUp(self):
        super().setUp()
        self.slots = q.blueprint(1)
        self.args = types.SimpleNamespace(test=1, budget=1, max_tokens=1800, solver_max_tokens=5000,
                                         editor_max_tokens=600, limit=147, references_obj=Refs())
        self.stages = []
        self.current = None

    def answer(self, client, model, system, prompt, cap, stage, *extra):
        self.stages.append(stage)
        data = json.loads(prompt)
        if stage == "author":
            self.current = question(data["assignment"])
            return copy.deepcopy(self.current)
        if stage == "solver":
            self.assertNotIn("answer", data)
            self.assertNotIn("explanation", data)
            self.assertEqual(data["response_format"], "mcq" if data["options"] else "spr")
            return {"valid": True, "answer": self.current["answer"][0], "reason": "Independent solution.", "issues": []}
        if stage == "editor": return {"approved": True, "reason": "Checked explanation."}
        raise AssertionError("Unexpected repair of a valid fixture")

    def run_generator(self, callback=None):
        fn = callback or self.answer
        with patch.object(q.Client, "call", lambda client, *args: fn(client, *args)):
            q.generate(self.args, self.slots, ["m"]*4, CATALOG, "offline", self.folder)

    def test_complete_147_slot_run_and_no_duplicate_on_resume(self):
        self.run_generator()
        bank = json.loads((self.folder/"test-1.json").read_text())
        self.assertEqual(len(bank), 147)
        self.assertEqual(q.validate_bank(bank, complete=True), [])
        self.assertTrue(all(row["audit_passed"] and not row["reviewed"] for row in bank))
        self.assertEqual(len(self.stages), 441)
        self.stages.clear()
        self.run_generator()
        self.assertEqual(self.stages, [])

    def test_replacement_after_three_failed_candidates_preserves_slot(self):
        self.args.limit = 1
        assignments = []
        def call(client, model, system, prompt, cap, stage, *extra):
            if stage == "author":
                assignments.append(json.loads(prompt)["assignment"])
                if len(assignments) <= 3: return {}
                self.assertIn("previous_attempt_was_rejected_because", json.loads(prompt))
            if stage == "repair": return {}
            return self.answer(client, model, system, prompt, cap, stage, *extra)
        self.run_generator(call)
        self.assertEqual(len(assignments), 4)
        self.assertTrue(all(slot == assignments[0] for slot in assignments))
        self.assertEqual(json.loads((self.folder/"test-1.failed.json").read_text()), [])

    def test_interrupt_and_resume_at_every_stage(self):
        self.args.limit = 1
        for stage in ("author", "solver", "editor"):
            with self.subTest(stage=stage), tempfile.TemporaryDirectory() as folder:
                self.folder = Path(folder)
                self.stages.clear()
                def call(client, model, system, prompt, cap, current, *extra):
                    if stage == current: raise KeyboardInterrupt()
                    return self.answer(client, model, system, prompt, cap, current, *extra)
                with self.assertRaises(KeyboardInterrupt): self.run_generator(call)
                self.stages.clear()
                self.run_generator()
                self.assertEqual(self.stages, ["author", "solver", "editor"][["author", "solver", "editor"].index(stage):])

    def test_null_issues_does_not_repeat_valid_question(self):
        self.args.limit = 1
        def call(*args):
            result = self.answer(*args)
            if args[5] == "solver": result["issues"] = None
            return result
        self.run_generator(call)
        self.assertEqual(self.stages, ["author", "solver", "editor"])

    def test_rejected_audit_repaired_and_reaudited_before_save(self):
        self.args.limit = 1
        repairs = []
        solver_count = 0
        def call(client, model, system, prompt, cap, stage, *extra):
            nonlocal solver_count
            if stage == "repair":
                repairs.append(json.loads(prompt))
                return copy.deepcopy(self.current)
            result = self.answer(client, model, system, prompt, cap, stage, *extra)
            if stage == "solver":
                solver_count += 1
                if solver_count == 1: result.update(valid=False, issues=["Ambiguous"])
            return result
        self.run_generator(call)
        self.assertEqual(solver_count, 2)
        self.assertEqual(repairs[0]["failed_stage"], "independent solver")
        self.assertIn("Ambiguous", repairs[0]["rejection_reason"])

    def test_changed_fingerprint_rechecks_saved_draft(self):
        self.args.limit = 1
        def stop_editor(client, model, system, prompt, cap, stage, *extra):
            if stage == "editor": raise KeyboardInterrupt()
            return self.answer(client, model, system, prompt, cap, stage, *extra)
        with self.assertRaises(KeyboardInterrupt): self.run_generator(stop_editor)
        self.stages.clear()
        with patch.object(q, "SOLVER", q.SOLVER+" Changed review rules."): self.run_generator()
        self.assertEqual(self.stages, ["solver", "editor"])

    def test_sentence_boundary_defects_rejected_locally(self):
        slot = next(v for v in self.slots if v["skill"] == "Sentence boundaries")
        item = {**question(slot), **{k:v for k,v in slot.items() if k != "format"}}
        q.check_item(None, item, slot, set())
        for change in ("repeated_words", "independent_clauses", "wrong_key"):
            value = copy.deepcopy(item)
            if change == "repeated_words": value["options"][0]["text"] = "limited, the"
            if change == "independent_clauses": value["passage"] = "The result was clear______ the researchers continued."
            if change == "wrong_key": value["answer"] = ["B"]
            with self.assertRaises(ValueError): q.check_item(None, value, slot, set())

    def test_malformed_question_fields_do_not_crash_validator(self):
        slot = self.slots[0]
        item = {**question(slot), **{k:v for k,v in slot.items() if k != "format"}}
        for field in ("passage", "prompt", "options", "answer", "explanation"):
            for value in (None, 42, {}, []):
                with self.subTest(field=field, value=value):
                    changed = {**item, field:value}
                    with self.assertRaises(ValueError): q.check_item(None, changed, slot, set())

    def test_spr_rejects_radicals_units_and_distinct_answer_values(self):
        slot = next(v for v in self.slots if v["format"] == "spr")
        item = {**question(slot), **{k:v for k,v in slot.items() if k != "format"}}
        for answers in (["sqrt(6)"], ["$4$"], ["4 meters"], ["1,000"], ["x=4"], ["1/0"], ["0", "-2"]):
            with self.subTest(answers=answers):
                with self.assertRaises(ValueError): q.check_item(None,{**item,"answer":answers},slot,set())
        q.check_item(None,{**item,"answer":["0.5","1/2"]},slot,set())

    def test_editor_repair_requires_new_independent_audit(self):
        self.args.limit = 1
        editor_count = 0
        def call(client, model, system, prompt, cap, stage, *extra):
            nonlocal editor_count
            if stage == "repair":
                self.assertEqual(json.loads(prompt)["failed_stage"], "editorial review")
                return copy.deepcopy(self.current)
            result = self.answer(client, model, system, prompt, cap, stage, *extra)
            if stage == "editor":
                editor_count += 1
                if editor_count == 1: return {"approved":False,"reason":"Distractor arithmetic is wrong."}
            return result
        self.run_generator(call)
        self.assertEqual(self.stages, ["author","solver","editor","solver","editor"])

    def test_saved_repair_survives_interruption(self):
        self.args.limit = 1
        solver_count = 0
        def call(client, model, system, prompt, cap, stage, *extra):
            nonlocal solver_count
            if stage == "repair": return copy.deepcopy(self.current)
            if stage == "solver":
                solver_count += 1
                if solver_count == 1: return {"valid":False,"answer":"A","reason":"Ambiguous","issues":["Ambiguous"]}
                raise KeyboardInterrupt()
            return self.answer(client, model, system, prompt, cap, stage, *extra)
        with self.assertRaises(KeyboardInterrupt): self.run_generator(call)
        saved = json.loads((self.folder/"test-1.checkpoint.json").read_text())
        self.assertEqual(saved["repair_count"], 1)
        self.stages.clear()
        self.run_generator()
        self.assertEqual(self.stages, ["solver","editor"])


class StudyPipelineTests(OfflineCase):
    def setUp(self):
        super().setUp()
        self.args = types.SimpleNamespace(output=self.folder, draft_model="m", audit_model="m", editor_model="m",
                                         budget=5, max_tokens=8000, topic="", limit=500)
        self.sources = [{"file":"book.pdf", "page":1, "sha256":"source", "text":"Independent reference material on the assigned skill."}]
        patch.object(s, "fetch_catalog", return_value=CATALOG).start()
        patch.dict(os.environ, {"OPENROUTER_API_KEY":"offline"}).start()
        patch.object(s, "select_sources", return_value=self.sources).start()
        self.stages = []

    def answer(self, client, model, system, prompt):
        data = json.loads(prompt)
        if system == s.AUTHOR:
            self.stages.append("author")
            return lesson(data["assignment"])
        if system == s.AUDIT:
            self.stages.append("audit")
            self.assertNotIn("answer", data["quiz"])
            self.assertNotIn("feedback", data["quiz"])
            self.assertIn("skill", data)
            return {"valid":True, "answer":0, "reason":"Solved independently.", "issues":[]}
        self.stages.append("editor")
        return {"approved":True, "reason":"Accurate and original."}

    def run_generator(self, callback=None):
        fn = callback or self.answer
        with patch.object(s.Client, "call", lambda client,*args: fn(client,*args)):
            s.generate_study(self.args, {"chunks":[]})

    def test_complete_plan_and_resume(self):
        self.run_generator()
        records = s.read_records(self.folder/"study-drafts.json")
        self.assertEqual(len(records), len(s.make_plan()))
        self.assertEqual(len(self.stages), len(records)*3)
        self.assertTrue(all(r["audit_passed"] and not r["reviewed"] for r in records))
        self.stages.clear()
        self.run_generator()
        self.assertEqual(self.stages, [])

    def test_resume_each_stage_preserves_unicode(self):
        self.args.limit = 1
        for system in (s.AUTHOR,s.AUDIT,s.EDITOR):
            with self.subTest(stage=system[:20]), tempfile.TemporaryDirectory() as folder:
                self.args.output = Path(folder)
                def call(client, model, current, prompt):
                    if current == system: raise KeyboardInterrupt()
                    result = self.answer(client, model, current, prompt)
                    if current == s.AUTHOR: result["summary"] = "Unicode: π, √, ≤, café"
                    return result
                with self.assertRaises(KeyboardInterrupt): self.run_generator(call)
                self.stages.clear()
                self.run_generator()
                start = (s.AUTHOR,s.AUDIT,s.EDITOR).index(system)
                self.assertEqual(self.stages, ["author","audit","editor"][start:])
                records = s.read_records(self.args.output/"study-drafts.json")
                if start: self.assertEqual(records[0]["lesson"]["summary"], "Unicode: π, √, ≤, café")

    def test_rejection_feedback_reaches_replacement(self):
        self.args.limit = 1
        calls = []
        def call(client, model, system, prompt):
            if system == s.AUTHOR:
                calls.append(json.loads(prompt))
                if len(calls) == 1: return {"title":"Incomplete"}
            return self.answer(client, model, system, prompt)
        self.run_generator(call)
        self.assertEqual(len(calls), 2)
        self.assertIn("summary", calls[1]["previous_attempt_was_rejected_because"])
        self.assertEqual(calls[0]["assignment"], calls[1]["assignment"])

    def test_unsupported_source_stops_without_repeated_spending(self):
        with self.assertRaisesRegex(RuntimeError, "do not support"):
            self.run_generator(lambda *args: {"unsupported":True})
        self.assertFalse((self.folder/"study-drafts.json").exists())

    def test_bad_audits_never_save(self):
        self.args.limit = 1
        for audit in ([], {"valid":True,"answer":True,"issues":[],"reason":"Wrong type"},
                      {"valid":False,"answer":0,"issues":[],"reason":"Invalid"},
                      {"valid":True,"answer":1,"issues":[],"reason":"Wrong key"},
                      {"valid":True,"answer":0,"issues":["Ambiguous"],"reason":"Multiple"}):
            with self.subTest(audit=audit):
                def call(client, model, system, prompt):
                    if system == s.AUDIT: return audit
                    return self.answer(client, model, system, prompt)
                with self.assertRaisesRegex(RuntimeError, "failed twice"): self.run_generator(call)
                self.assertFalse((self.folder/"study-drafts.json").exists())

    def test_editor_rejection_is_not_published_or_saved(self):
        def call(client, model, system, prompt):
            if system == s.EDITOR: return {"approved":False,"reason":"Inaccurate distractor explanation"}
            return self.answer(client, model, system, prompt)
        with self.assertRaisesRegex(RuntimeError, "failed twice"): self.run_generator(call)
        self.assertFalse((self.folder/"study-drafts.json").exists())

    def test_edited_or_unaudited_saved_record_stops_resume(self):
        self.args.limit = 1
        self.run_generator()
        file = self.folder/"study-drafts.json"
        original = s.read_records(file)
        for change in ("edited", "unaudited"):
            records = copy.deepcopy(original)
            if change == "edited": records[0]["lesson"]["title"] = "Edited"
            else: records[0]["audit_passed"] = False
            s.atomic_json(file, records)
            with self.assertRaisesRegex(RuntimeError, "unaudited or was edited"): self.run_generator()

    def test_quiz_copy_and_cosmetic_duplicate_options_rejected(self):
        slot = s.make_plan()[0]
        value = {**lesson(slot), **{k:slot[k] for k in ("id","section","domain")}}
        value["quiz"]["options"] = ["Yes", " yes ", "No", "Maybe"]
        with self.assertRaises(ValueError): s.validate_lesson(value)
        copied = " ".join("word"+str(i) for i in range(25))
        value["quiz"]["feedback"] = copied
        with self.assertRaisesRegex(ValueError,"copied span"): s.check_overlap(value,[{"text":copied}])

    def test_null_issues_accepted_with_explicit_valid_answer(self):
        self.args.limit = 1
        def call(*args):
            result = self.answer(*args)
            if args[2] == s.AUDIT: result["issues"] = None
            return result
        self.run_generator(call)
        self.assertEqual(self.stages, ["author","audit","editor"])


class SourceStorageAndPublicationTests(OfflineCase):
    def test_atomic_write_failure_preserves_previous_file(self):
        for module in (q,s):
            file = self.folder/(module.__name__+".json")
            module.atomic_json(file,{"saved":True})
            before = file.read_bytes()
            with patch.object(module.os, "replace", side_effect=OSError("Disk unavailable")):
                with self.assertRaises(OSError): module.atomic_json(file,{"saved":False})
            self.assertEqual(file.read_bytes(), before)

    def test_lock_release_after_exception_for_both_generators(self):
        for module in (q,s):
            file = self.folder/(module.__name__+".lock")
            with self.assertRaises(ValueError):
                with module.GenerationLock(file):
                    with self.assertRaises(RuntimeError):
                        with module.GenerationLock(file): pass
                    raise ValueError("interrupted")
            with module.GenerationLock(file): pass

    def test_sources_skip_contents_deduplicate_pages_and_limit_three(self):
        slot = {"skill":"Linear equations", "domain":"Algebra"}
        def chunk(page, text="Linear equations in algebra", sha="book"):
            return {"text":text,"sha256":sha,"page":page,"file":"book.pdf"}
        index = {"chunks":[chunk(0,"Table of contents: linear equations"),chunk(1),chunk(1),chunk(2),chunk(3),chunk(4)]}
        self.assertEqual([r["page"] for r in s.select_sources(slot,index)], [1,2,3])
        self.assertEqual(s.select_sources(slot,{"chunks":[chunk(1,"Unrelated biology")] }), [])

    def test_pdf_extraction_handles_duplicates_scans_encryption_and_corruption(self):
        pdf = types.ModuleType("pypdf")
        text = "Linear equations and algebra provide a method for reasoning about quantities. "*8
        page = lambda value: types.SimpleNamespace(extract_text=lambda:value)
        def reader(path):
            name = Path(path).name
            if name == "corrupt.pdf": raise ValueError("corrupt fixture")
            if name == "locked.pdf": return types.SimpleNamespace(is_encrypted=True,decrypt=lambda password:False)
            return types.SimpleNamespace(is_encrypted=False,pages=[page(text),page(text),page(None)])
        pdf.PdfReader = reader
        for name in ("good.pdf","locked.pdf","corrupt.pdf"):
            (self.folder/name).write_bytes(b"mock PDF "+name.encode())
        with patch.dict(sys.modules,{"pypdf":pdf}):
            index = s.extract_pdfs(self.folder,self.folder/"out")
        self.assertEqual(len(index["chunks"]),1)
        self.assertEqual(len(index["files"]),3)
        self.assertEqual(sum("error" in row for row in index["files"]),2)
        good = next(row for row in index["files"] if row["file"]=="good.pdf")
        self.assertEqual(good["skipped_pages"],1)

    def test_pdf_no_readable_text_reports_actionable_error(self):
        pdf = types.ModuleType("pypdf")
        pdf.PdfReader = lambda path: types.SimpleNamespace(is_encrypted=False,pages=[])
        (self.folder/"scan.pdf").write_bytes(b"mock")
        with patch.dict(sys.modules,{"pypdf":pdf}):
            with self.assertRaisesRegex(RuntimeError,"No readable PDF text"):
                s.extract_pdfs(self.folder,self.folder/"out")
        self.assertTrue((self.folder/"out/pdf-index.json").exists())

    def test_publication_uses_one_transaction_and_rolls_back_failure(self):
        slot = s.make_plan()[0]
        value = {**lesson(slot), **{k:slot[k] for k in ("id","section","domain")}}
        record = {"lesson":value,"reviewed":True,"audit_passed":True,"audit_hash":s.lesson_hash(value),"sources":[]}
        file = self.folder/"reviewed.json"
        s.atomic_json(file,[record])
        driver = types.ModuleType("psycopg")
        driver.Error = type("DatabaseError",(Exception,),{})
        events = []
        class Transaction:
            def __init__(self, fail): self.fail = fail
            def __enter__(self): return self
            def __exit__(self, kind, error, traceback): events.append("rollback" if kind else "commit")
            def cursor(self): return contextlib.nullcontext(self)
            def execute(self, sql, params):
                events.append("execute")
                self_params = params
                if self.fail: raise driver.Error("mock database failure")
                if self_params[0] != slot["id"]: raise AssertionError("Wrong lesson ID")
        adapter = types.ModuleType("psycopg.types.json")
        adapter.Jsonb = lambda value:value
        with patch.dict(sys.modules,{"psycopg":driver,"psycopg.types.json":adapter}), patch.dict(os.environ,{"DATABASE_URL":"offline"}):
            driver.connect = lambda *args,**kwargs:Transaction(False)
            s.publish(file)
            self.assertEqual(events,["execute","commit"])
            events.clear()
            driver.connect = lambda *args,**kwargs:Transaction(True)
            with self.assertRaisesRegex(RuntimeError,"transaction rolled back"): s.publish(file)
            self.assertEqual(events,["execute","rollback"])

    def test_duplicate_lesson_records_are_rejected(self):
        slot = s.make_plan()[0]
        value = {**lesson(slot), **{k:slot[k] for k in ("id","section","domain")}}
        file = self.folder/"duplicate.json"
        s.atomic_json(file,[{"lesson":value},{"lesson":value}])
        with self.assertRaisesRegex(ValueError,"Duplicate lesson ID"): s.read_records(file)


if __name__ == "__main__":
    unittest.main()
