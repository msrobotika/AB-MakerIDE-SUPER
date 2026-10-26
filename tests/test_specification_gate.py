"""Behavioral tests of delivery governance, without AI or hardware."""

import hashlib
import json
from pathlib import Path
import subprocess
import tempfile
import unittest

import specification_gate as gate


class SpecificationGateTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()
        self.feature = "specs/001-example"
        self.write(
            ".specify/memory/quality-gate.json", {"schema_version": 1, "feature": self.feature}
        )
        for name in gate.REQUIRED_DOCUMENTS:
            self.write(self.feature + "/" + name, "Reviewed document\n")
        self.write(self.feature + "/spec.md", "- **FR-001**: Reject incomplete deliveries.\n")
        self.write(self.feature + "/tasks.md", "- [x] T001 Verify behavior\n")
        self.write(self.feature + "/checklists/requirements.md", "- [x] Reviewed requirement\n")
        self.write("tool.py", "print('example')\n")
        self.record = {
            "schema_version": 1,
            "convergence": "converged",
            "requirements": [
                {
                    "id": "FR-001",
                    "result": "passed",
                    "notes": "Fixture only",
                    "evidence": ["tool.py"],
                }
            ],
            "changed_files": {"tool.py": self.digest("tool.py")},
        }
        self.save()

    def write(self, name, data):
        path = self.root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        content = json.dumps(data) if isinstance(data, dict) else data
        path.write_bytes(content.encode())

    def digest(self, name):
        return hashlib.sha256((self.root / name).read_bytes()).hexdigest()

    def save(self):
        self.write(self.feature + "/verification.json", self.record)

    def rejected(self, text):
        result = gate.validate(self.root)
        self.assertFalse(result["passed"])
        self.assertIn(text, " ".join(result["errors"]))

    def test_arduino_sources_require_delivery_hashes(self):
        self.assertTrue(gate.technical("examples/cyd_space_invaders/cyd_space_invaders.ino"))
        self.assertTrue(gate.technical("examples/cyd_space_invaders/SpaceInvaders.h"))
        self.assertTrue(gate.technical("src/hardware/driver.cpp"))
        self.assertFalse(gate.technical("docs/example.md"))

    def test_complete_delivery_and_no_comparison_are_explicit(self):
        result = gate.validate(self.root)
        self.assertTrue(result["passed"], result)
        self.assertFalse(result["base_compared"])
        self.assertEqual(result["requirements"], 1)

    def test_missing_empty_and_ambiguous_document(self):
        for text in ("", "[NEEDS CLARIFICATION: target]", "TODO: implementation", "[FEATURE NAME]"):
            with self.subTest(text=text):
                self.write(self.feature + "/plan.md", text)
                self.rejected("plan.md")
        (self.root / self.feature / "plan.md").unlink()
        self.rejected("plan.md")

    def test_open_tasks_and_checklists(self):
        for name in ("tasks.md", "checklists/requirements.md"):
            for text in ("- [ ] Pending\n", "- [-] Pending\n", "No checklist\n"):
                with self.subTest(name=name, text=text):
                    self.write(self.feature + "/" + name, text)
                    self.rejected(name)
            self.write(self.feature + "/" + name, "- [x] Reviewed\n")

    def test_requirements_must_match_exactly_once(self):
        for rows in (
            [],
            self.record["requirements"] * 2,
            [dict(self.record["requirements"][0], id="FR-002")],
        ):
            with self.subTest(rows=rows):
                original = self.record["requirements"]
                self.record["requirements"] = rows
                self.save()
                self.rejected("requisit")
                self.record["requirements"] = original

    def test_spec_cannot_duplicate_requirements(self):
        self.write(self.feature + "/spec.md", "- **FR-001**: A\n- **FR-001**: B\n")
        self.rejected("duplicad")

    def test_evidence_required_and_must_exist(self):
        for evidence in ([], ["missing.md"], "tool.py"):
            with self.subTest(evidence=evidence):
                self.record["requirements"][0]["evidence"] = evidence
                self.save()
                self.rejected("eviden")

    def test_pending_failed_or_undocumented_results_rejected(self):
        for key, value in (("result", "failed"), ("notes", "")):
            original = self.record["requirements"][0][key]
            self.record["requirements"][0][key] = value
            self.save()
            self.rejected("FR-001")
            self.record["requirements"][0][key] = original
        self.record["convergence"] = "partial"
        self.save()
        self.rejected("converg")

    def test_changed_content_rejects_stale_verification(self):
        self.write("tool.py", "print('changed after verification')\n")
        self.rejected("huella")

    def test_paths_cannot_escape_or_use_windows_absolute_paths(self):
        for name in ("../outside", "/etc/passwd", "C:/Windows/win.ini", "specs/../tool.py", "a\\b"):
            with self.subTest(name=name):
                self.record["requirements"][0]["evidence"] = [name]
                self.save()
                self.rejected("ruta")

    def test_feature_reference_cannot_leave_specs(self):
        self.write(".specify/memory/quality-gate.json", {"schema_version": 1, "feature": ".git"})
        self.rejected("specs/")

    def test_redirected_evidence_rejected(self):
        original = self.root / "tool.py"
        linked = self.root / "linked.py"
        try:
            linked.hardlink_to(original)
        except OSError as error:
            self.skipTest(str(error))
        self.record["requirements"][0]["evidence"] = ["linked.py"]
        self.save()
        self.rejected("enlace")

    def test_invalid_json_and_schema(self):
        self.write(self.feature + "/verification.json", "{")
        self.rejected("JSON")
        self.record["schema_version"] = 99
        self.save()
        self.rejected("schema")

    def test_hash_map_must_be_nonempty_and_technical(self):
        self.record["changed_files"] = {}
        self.save()
        self.rejected("changed_files")
        self.record["changed_files"] = {self.feature + "/spec.md": "0" * 64}
        self.save()
        self.rejected("técnic")

    def test_git_base_covers_modified_added_and_deleted_files(self):
        def git(*args):
            return (
                subprocess.check_output(["git", *args], cwd=self.root, stderr=subprocess.DEVNULL)
                .decode()
                .strip()
            )

        git("init", "-q")
        self.write("deleted.py", "old\n")
        git("add", ".")
        git("-c", "user.name=Test", "-c", "user.email=test@local", "commit", "-qm", "baseline")
        base = git("rev-parse", "HEAD")
        (self.root / "deleted.py").unlink()
        self.write("new.js", "const example = 1;\n")
        git("add", "-A")
        result = gate.validate(self.root, base)
        self.assertFalse(result["passed"])
        self.assertIn("sin cobertura", " ".join(result["errors"]))
        self.record["changed_files"].update(
            {"new.js": self.digest("new.js"), "deleted.py": "deleted"}
        )
        self.save()
        result = gate.validate(self.root, base)
        self.assertTrue(result["passed"], result)
        self.assertTrue(result["base_compared"])

    def test_invalid_and_unavailable_base_fail_instead_of_skipping(self):
        for base in ("HEAD~1", "--output=bad", "a" * 40):
            result = gate.validate(self.root, base)
            self.assertFalse(result["passed"], result)
        self.assertTrue(gate.validate(self.root, "0" * 40)["passed"])


if __name__ == "__main__":
    unittest.main()
