from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest


class ManifestIntegrityTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root / "tests").mkdir()
        shutil.copy2(Path(__file__).with_name("manifest.py"), self.root / "tests/manifest.py")
        (self.root / "VERSION").write_text("0.0.0-test\n")
        (self.root / "data.txt").write_text("fixture\n")
        subprocess.run(["git", "init", "-q"], cwd=self.root, check=True, capture_output=True)

    def run_manifest(self, *args):
        return subprocess.run(
            [sys.executable, "tests/manifest.py", *args], cwd=self.root, capture_output=True
        )

    def test_content_tampering_fails_verification(self):
        self.assertEqual(self.run_manifest("--write").returncode, 0)
        subprocess.run(["git", "add", "."], cwd=self.root, check=True, capture_output=True)
        self.assertEqual(self.run_manifest().returncode, 0)
        (self.root / "data.txt").write_text("modified fixture\n")
        self.assertNotEqual(self.run_manifest().returncode, 0)

    def test_unlisted_tracked_file_and_path_escape_fail(self):
        self.assertEqual(self.run_manifest("--write").returncode, 0)
        (self.root / "new.txt").write_text("unlisted fixture\n")
        subprocess.run(["git", "add", "."], cwd=self.root, check=True, capture_output=True)
        self.assertNotEqual(self.run_manifest().returncode, 0)
        path = self.root / "MANIFEST_SHA256.txt"
        content = path.read_text().replace("  data.txt", "  ../outside.txt")
        path.write_text(content)
        self.assertNotEqual(self.run_manifest().returncode, 0)
