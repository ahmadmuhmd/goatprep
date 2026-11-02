"""Offline tests: no API credentials or paid requests."""
import importlib.util
import contextlib
import io
import json
from pathlib import Path
import sys
import tempfile
import types
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import generate_questions as gen
(gen.ROOT / "output").mkdir(exist_ok=True)

class ReferencesStub:
    digest = "offline-fixture"
    def select(self, slot, salt=0): return []
    def check_original(self, q): pass

def arguments(**overrides):
    values = dict(test=1, budget=1, max_tokens=1800, solver_max_tokens=5000,
                  editor_max_tokens=600, limit=1, references_obj=ReferencesStub())
    values.update(overrides)
    return types.SimpleNamespace(**values)

def configure_client(client):
    client.ledger = {"reserved":0.01,"calls":3,"stage_usd":{}}
    client.budget = 1
    client.item_usd = 0.0

class GeneratorTests(unittest.TestCase):
    def test_numeric_equivalence(self):
        self.assertTrue(gen.same_answer(["0.5"], "1/2"))
        self.assertFalse(gen.same_answer(["0.5"], "0.5001"))
        self.assertFalse(gen.same_answer(["0"], "1/0"))
        self.assertTrue(gen.same_answer(["C"], "C"))

    def test_budget_stops_before_network(self):
        with tempfile.TemporaryDirectory(dir=gen.ROOT / "output") as folder:
            client = gen.Client("test", ["m"], {"m":{"pricing":{"prompt":"1","completion":"1"}}},
                                Path(folder)/"ledger.json", 1)
            with patch.object(gen, "urlopen") as network:
                with self.assertRaisesRegex(RuntimeError, "budget ceiling"):
                    client.call("m", "system", "prompt", 1000, "author")
                network.assert_not_called()

    def test_network_failure_keeps_reservation(self):
        with tempfile.TemporaryDirectory(dir=gen.ROOT / "output") as folder:
            path = Path(folder)/"ledger.json"
            client = gen.Client("test", ["m"], {"m":{"pricing":{"prompt":"0.000001","completion":"0.000002"}}}, path, 1)
            with patch.object(gen, "urlopen", side_effect=gen.URLError("offline")), patch.object(gen.time, "sleep"):
                with self.assertRaises(RuntimeError):
                    client.call("m", "system", "prompt", 1000, "author")
            ledger = json.loads(path.read_text())
            self.assertEqual(ledger["calls"], gen.MAX_REQUEST_ATTEMPTS)
            self.assertGreater(ledger["reserved"], 0)

    def test_unavailable_model_no_fallback(self):
        with self.assertRaisesRegex(RuntimeError, "Model unavailable"):
            gen.Client("test", ["missing"], {}, Path("unused"), 1)

    def test_unsupported_extra_charge_rejected(self):
        with self.assertRaisesRegex(RuntimeError, "Unsupported extra"):
            gen.Client("test", ["m"], {"m":{"pricing":{"prompt":"0","completion":"0","request":"1"}}}, Path("unused"), 1)

    def test_three_pass_gate_and_resume(self):
        slot = {"id":"test-1-rw1-1","test_id":"test-1","module":"rw1","position":1,
                "domain":"Information and Ideas","skill":"Inferences","difficulty":2,"scored":True,"format":"mcq"}
        item = {"passage":"A self-contained passage.", "prompt":"Which conclusion follows from this text?",
                "options":[{"letter":x,"text":"Choice "+x} for x in "ABCD"],"answer":["B"],
                "explanation":"B follows from the evidence; the other choices are unsupported."}
        args = arguments()
        def bridge(node, action, value=None, payload=None):
            return []
        with tempfile.TemporaryDirectory(dir=gen.ROOT / "output") as folder:
            with patch.object(gen, "node_call", side_effect=bridge), patch.object(gen, "Client") as cls:
                client = cls.return_value
                configure_client(client)
                client.call.side_effect = [item, {"valid":True,"answer":"B","reason":"Independent evidence.","issues":[]},
                                          {"approved":True,"reason":"Clear and accurate."}]
                gen.generate(args,[slot],["draft","audit","editor","math-audit"],{}, "test",Path(folder))
                blind = json.loads(client.call.call_args_list[1].args[2])
                self.assertNotIn("answer", blind)
                self.assertNotIn("explanation", blind)
                bank = json.loads((Path(folder)/"test-1.json").read_text())
                self.assertTrue(bank[0]["audit_passed"])
                self.assertFalse(bank[0]["reviewed"])
                client.call.reset_mock()
                gen.generate(args,[slot],["draft","audit","editor","math-audit"],{}, "test",Path(folder))
                client.call.assert_not_called()

    def test_rejected_audit_never_saves_item(self):
        slot={"id":"test-1-rw1-1","test_id":"test-1","module":"rw1","position":1,
              "domain":"Information and Ideas","skill":"Inferences","difficulty":2,"scored":True,"format":"mcq"}
        item={"passage":"Sample","prompt":"Which conclusion follows?",
              "options":[{"letter":x,"text":x} for x in "ABCD"],"answer":["B"],"explanation":"Explanation"}
        args=arguments()
        with tempfile.TemporaryDirectory(dir=gen.ROOT / "output") as folder:
            with patch.object(gen,"node_call",return_value=[]),patch.object(gen,"Client") as cls:
                client=cls.return_value
                configure_client(client)
                client.call.side_effect=[item,{"valid":True,"answer":"C","reason":"Mismatch","issues":[]},
                                         RuntimeError("budget ceiling")]
                with self.assertRaisesRegex(RuntimeError,"budget ceiling"):
                    gen.generate(args,[slot],["draft","audit","editor","math-audit"],{},"test",Path(folder))
                self.assertFalse((Path(folder)/"test-1.json").exists())



class StandaloneTests(unittest.TestCase):
    def fixture(self):
        slot=next(s for s in gen.blueprint(1) if s["skill"]=="Inferences")
        item={"passage":"An original self-contained passage about a research observation.",
              "prompt":"Which choice best completes the text?",
              "options":[{"letter":x,"text":"Distinct choice "+x} for x in "ABCD"],"answer":["B"],
              "explanation":"B follows from the evidence. A contradicts it; C changes the scope; D is unsupported."}
        return slot,item

    def test_resume_reuses_draft_and_audit_after_interrupt(self):
        slot,item=self.fixture()
        args=arguments()
        audit={"valid":True,"answer":"B","reason":"Independent solution with evidence.","issues":[]}
        with tempfile.TemporaryDirectory(dir=gen.ROOT/"output") as folder:
            with patch.object(gen,"Client") as cls:
                client=cls.return_value
                configure_client(client)
                client.call.side_effect=[item,audit,KeyboardInterrupt()]
                with self.assertRaises(KeyboardInterrupt):
                    gen.generate(args,[slot],["draft","audit","editor","math-audit"],{},"test",Path(folder))
                saved=json.loads((Path(folder)/"test-1.checkpoint.json").read_text())
                self.assertEqual(saved["draft"],item)
                self.assertEqual(saved["audit"],audit)
                client.call.reset_mock()
                client.call.side_effect=[{"approved":True,"reason":"Reviewed."}]
                gen.generate(args,[slot],["draft","audit","editor","math-audit"],{},"test",Path(folder))
                self.assertEqual(client.call.call_count,1)
                self.assertEqual(client.call.call_args.args[0],"editor")
                self.assertEqual(len(json.loads((Path(folder)/"test-1.json").read_text())),1)

    def test_lock_release_after_process_is_killed(self):
        import subprocess
        with tempfile.TemporaryDirectory(dir=gen.ROOT/"output") as folder:
            lock=str(Path(folder)/"generation.lock")
            code=("import sys,time;sys.path.insert(0,"+repr(str(gen.ROOT/"scripts"))+");"
                  "from generate_questions import GenerationLock;"
                  "lock=GenerationLock("+repr(lock)+");lock.__enter__();"
                  "print('LOCKED',flush=True);time.sleep(30)")
            child=subprocess.Popen([sys.executable,"-c",code],stdout=subprocess.PIPE,text=True)
            try:
                self.assertEqual(child.stdout.readline().strip(),"LOCKED")
                with self.assertRaises(RuntimeError):
                    with gen.GenerationLock(Path(lock)): pass
                child.terminate()
                child.wait(timeout=10)
                with gen.GenerationLock(Path(lock)): pass
            finally:
                if child.poll() is None: child.kill();child.wait()
                child.stdout.close()

    def test_all_routes_have_exact_public_domain_targets(self):
        for number in range(1,19):
            slots=gen.blueprint(number)
            self.assertEqual(len(slots),147)
            for branch in ("easy","hard"):
                rw=[q for q in slots if q["scored"] and q["module"] in ("rw1","rw2"+branch)]
                math=[q for q in slots if q["scored"] and q["module"] in ("math1","math2"+branch)]
                self.assertEqual([sum(q["domain"]==d for q in rw) for d in list(gen.SKILLS)[:4]],[14,13,13,10])
                self.assertEqual([sum(q["domain"]==d for q in math) for d in list(gen.SKILLS)[4:]],[14,14,6,6])
                administered=[q for q in slots if q["module"] in ("math1","math2"+branch)]
                self.assertEqual(sum(q["format"]=="spr" for q in administered),11)

    def test_reference_filter_and_copy_rejection(self):
        with tempfile.TemporaryDirectory(dir=gen.ROOT/"output") as folder:
            path=Path(folder)/"refs.json"
            text="Which choice describes the main purpose of this passage? An observer records the changing behavior of birds through a season and compares the pattern with earlier observations. A) First B) Second C) Third D) Fourth"
            path.write_text(json.dumps([{"source_pdf":"digital-test.pdf","raw_content":text},
                                       {"source_pdf":"digital-test-copy.pdf","raw_content":text},
                                       {"source_pdf":"2015 SAT.pdf","raw_content":text+" Older"},
                                       {"source_pdf":"digital-test.pdf","raw_content":"Answer explanations: Choice A is correct. "+text}]))
            refs=gen.References(path)
            self.assertEqual(len(refs.items),1)
            self.assertEqual(refs.report["duplicates"],1)
            slot,item=self.fixture()
            self.assertTrue(refs.select(slot))
            item["passage"]=text
            with self.assertRaises(ValueError): refs.check_original(item)

    def test_python_blueprint_matches_website(self):
        import os,shutil,subprocess
        node=os.environ.get("GOATPREP_TEST_NODE") or shutil.which("node")
        if not node: self.skipTest("Node needed only for website parity test")
        for number in range(1,19):
            result=subprocess.run([node,str(gen.ROOT/"scripts/content-bridge.mjs"),"blueprint",str(number)],
                                  capture_output=True,text=True,check=True)
            self.assertEqual(gen.blueprint(number),json.loads(result.stdout))

    def test_complete_python_bank_passes_website_validator(self):
        import os,shutil,subprocess
        node=os.environ.get("GOATPREP_TEST_NODE") or shutil.which("node")
        if not node: self.skipTest("Node needed only for website integration test")
        bank=[]
        for slot in gen.blueprint(1):
            q={k:v for k,v in slot.items() if k!="format"}
            q.update(passage="Unique context "+slot["id"],prompt="Which result is correct for "+slot["id"]+"?",
                     options=[{"letter":x,"text":"Choice "+x} for x in "ABCD"] if slot["format"]=="mcq" else [],
                     answer=["B" if slot["format"]=="mcq" else "0.5"],
                     explanation="A complete checked explanation with the relevant solution.")
            bank.append(q)
        self.assertEqual(gen.validate_bank(bank,True),[])
        result=subprocess.run([node,str(gen.ROOT/"scripts/content-bridge.mjs"),"validate"],
                              input=json.dumps({"bank":bank,"complete":True}),capture_output=True,text=True,check=True)
        self.assertEqual(json.loads(result.stdout),[])

if __name__ == "__main__":
    unittest.main()



