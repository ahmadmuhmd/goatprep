import json
from pathlib import Path
import sys
import tempfile
import types
import unittest
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"scripts"))
import generate_study_resources as g
(g.ROOT/"output").mkdir(exist_ok=True)

def lesson():
    return {"id":"resource-words-in-context","section":"rw","domain":"Craft and Structure",
      "title":"Words in context","summary":"Choose meaning from context.",
      "concept":"Use the relationship between ideas to determine the meaning that fits the blank.",
      "steps":["Read the sentence.","Predict the meaning.","Check every option."],
      "example":"The speaker was cautious despite the promising result. What does cautious mean?",
      "explanation":"Cautious means careful here. The contrast shows that the speaker has not become confident.",
      "quiz":{"prompt":"What does cautious mean?","options":["careful","loud","certain","rapid"],"answer":0,
              "feedback":"Careful fits; loud is volume, certain contradicts caution, and rapid concerns speed."}}

class StudyTests(unittest.TestCase):
    def test_valid_ui_payload(self):
        self.assertEqual(g.validate_lesson(lesson())["quiz"]["answer"],0)
    def test_bad_domain_and_quiz_rejected(self):
        for change in ("domain","quiz"):
            l=lesson()
            if change=="domain": l["domain"]="Algebra"
            else:l["quiz"]["answer"]=4
            with self.assertRaises(ValueError):g.validate_lesson(l)
    def test_unreviewed_or_edited_records_never_publish(self):
        with tempfile.TemporaryDirectory(dir=g.ROOT/"output") as folder:
            p=Path(folder)/"bank.json"
            record={"lesson":lesson(),"reviewed":False,"audit_passed":True,"audit_hash":g.lesson_hash(lesson()),"sources":[]}
            g.atomic_json(p,[record])
            with patch.object(g,"urlopen") as net:
                with self.assertRaises(ValueError):g.publish(p)
                record["reviewed"]=True;record["lesson"]["title"]="Changed";g.atomic_json(p,[record])
                with self.assertRaises(ValueError):g.publish(p)
                net.assert_not_called()
    def test_sources_require_topic_match(self):
        self.assertEqual(g.select_sources({"skill":"Circles","domain":"Geometry and Trigonometry"},{"chunks":[{"text":"Unrelated vocabulary."}]}),[])
    def test_resume_keeps_audited_lesson(self):
        with tempfile.TemporaryDirectory(dir=g.ROOT/"output") as folder:
            args=types.SimpleNamespace(output=Path(folder),draft_model="a",audit_model="b",editor_model="c",
                budget=5,max_tokens=8000,topic="words in context",limit=1)
            sources=[{"file":"book.pdf","page":4,"sha256":"a","text":"Context determines word meaning."}]
            draft={k:v for k,v in lesson().items() if k not in ("id","section","domain")}
            with patch.object(g,"legacy_key",return_value="test"),patch.object(g,"fetch_catalog",return_value={}),patch.object(g,"select_sources",return_value=sources),patch.object(g,"Client") as cls:
                client=cls.return_value;client.ledger={"reserved":0.1}
                client.call.side_effect=[draft,{"valid":True,"answer":0,"issues":[],"reason":"Solved."},KeyboardInterrupt()]
                with self.assertRaises(KeyboardInterrupt):g.generate_study(args,{"chunks":[]})
                client.call.reset_mock();client.call.side_effect=[{"approved":True,"reason":"Good."}]
                g.generate_study(args,{"chunks":[]})
                self.assertEqual(client.call.call_count,1)
                records=g.read_records(Path(folder)/"study-drafts.json")
                self.assertFalse(records[0]["reviewed"])
                self.assertEqual(records[0]["audit_hash"],g.lesson_hash(records[0]["lesson"]))
    def test_review_html_escapes_script_injection(self):
        with tempfile.TemporaryDirectory(dir=g.ROOT/"output") as folder:
            p=Path(folder)/"bank.json";l=lesson();l["summary"]="</script><script>alert(1)</script>"
            g.atomic_json(p,[{"lesson":l,"sources":[],"reviewed":False}]);g.create_review(p)
            self.assertNotIn("</script><script>alert(1)",p.with_suffix(".review.html").read_text())

if __name__=="__main__":unittest.main()
