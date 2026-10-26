import io
import json
from pathlib import Path
import tempfile
import threading
import time
import unittest
from unittest.mock import patch
import zipfile
from ab_makeride import agent_runtime as ar
from ab_makeride import agent_projects as projects
from ab_makeride import jobs


class AgentProjectTests(unittest.TestCase):
    def test_export_current_editor_keeps_headers_without_mutating_workspace(self):
        original = (self.folder / "sketch.ino").read_bytes()
        with zipfile.ZipFile(
            io.BytesIO(
                self.manager.export_project(self.job.id, "// EDITADO\nvoid setup(){} void loop(){}")
            )
        ) as archive:
            self.assertIn(b"EDITADO", archive.read("sketch/sketch.ino"))
            self.assertIn("sketch/radar_config.h", archive.namelist())
        self.assertEqual((self.folder / "sketch.ino").read_bytes(), original)

    def test_saved_zip_reopens_with_auxiliaries_without_running_cli_or_hardware(self):
        archive = self.manager.export_project(self.job.id)
        with patch.object(self.manager, "_work") as worker:
            imported = self.manager.import_project(archive)
            worker.assert_not_called()
        self.assertEqual(imported["code"], self.job.before)
        self.assertIn("radar_config.h", self.manager.project_files(imported["job_id"])[1])
        result = self.manager.get(imported["job_id"])
        self.assertEqual(result["outcome"], "imported_project")
        self.assertFalse(any(result["evidence"].values()))
        recovered = ar.AgentJobManager(self.root).get(imported["job_id"])
        self.assertEqual(recovered["outcome"], "imported_project")
        self.assertIsNone(recovered["success"])

    def test_source_zip_rejects_paths_links_duplicates_and_oversized_content(self):
        for kind in ("path", "link", "duplicate", "size"):
            with self.subTest(kind=kind):
                data = io.BytesIO()
                with zipfile.ZipFile(data, "w", compression=zipfile.ZIP_DEFLATED) as archive:
                    archive.writestr("sketch/sketch.ino", "void setup(){} void loop(){}")
                    if kind == "path":
                        archive.writestr("sketch/../escape.h", "bad")
                    elif kind == "link":
                        info = zipfile.ZipInfo("sketch/link.h")
                        info.create_system = 3
                        info.external_attr = 0o120777 << 16
                        archive.writestr(info, "outside")
                    elif kind == "duplicate":
                        archive.writestr("sketch/SKETCH.INO", "duplicate")
                    else:
                        archive.writestr("sketch/huge.h", b"x" * (projects.MAX_PROJECT_BYTES + 1))
                with self.assertRaises(ValueError):
                    self.manager.import_project(data.getvalue())

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.manager = ar.AgentJobManager(self.root)
        with (
            patch.object(ar.shutil, "which", return_value="/fake/codex"),
            patch.object(self.manager, "_work"),
        ):
            self.entry = self.manager.start(
                provider="codex",
                mode="supervisado",
                prompt="Crear radar",
                code="void setup(){}\nvoid loop(){}",
                lang="cpp",
                fqbn="esp32:esp32:esp32",
                port="COM4",
                confirmed=True,
            )
        self.job = self.manager._current
        self.job.active = False
        self.job.success = True
        self.job.exit_code = 0
        self.job.persist()
        self.folder = Path(self.entry["workspace"])
        (self.folder / "radar_config.h").write_bytes(b"#define LCD_BL 32\n")

    def test_export_preserves_auxiliary_files_and_arduino_layout(self):
        with zipfile.ZipFile(io.BytesIO(self.manager.export_project(self.job.id))) as archive:
            self.assertIn("sketch/sketch.ino", archive.namelist())
            self.assertEqual(archive.read("sketch/radar_config.h"), b"#define LCD_BL 32\n")
            self.assertEqual(
                json.loads(archive.read("sketch/MAKERIDE_EXPORT.json"))["fqbn"], "esp32:esp32:esp32"
            )
            self.assertFalse(any(".makeride_" in name for name in archive.namelist()))

    def test_hidden_builds_binaries_and_credentials_are_not_exported(self):
        (self.folder / ".build").mkdir()
        (self.folder / ".build/large.h").write_text("not project")
        for name in (".env", "secrets.json", "firmware.bin", "sketch.original.txt"):
            (self.folder / name).write_text("excluded")
        files = self.manager.project_files(self.job.id)[1]
        self.assertEqual(set(files), {"sketch.ino", "radar_config.h"})

    def test_continuation_copies_header_and_preserves_current_editor(self):
        before = (self.folder / "sketch.ino").read_bytes()
        with (
            patch.object(ar.shutil, "which", return_value="/fake/codex"),
            patch.object(self.manager, "_work"),
        ):
            child = self.manager.start(
                provider="codex",
                mode="supervisado",
                prompt="Continuar radar",
                code="// editado por el usuario",
                lang="cpp",
                fqbn="esp32:esp32:esp32",
                confirmed=True,
                parent_job_id=self.job.id,
            )
        new = Path(child["workspace"])
        self.assertEqual((new / "radar_config.h").read_text(), "#define LCD_BL 32\n")
        self.assertEqual((new / "sketch.ino").read_text(), "// editado por el usuario")
        self.assertEqual((self.folder / "sketch.ino").read_bytes(), before)

    def test_running_job_cannot_be_exported_or_inherited(self):
        self.job.active = True
        with self.assertRaisesRegex(ValueError, "termine"):
            self.manager.export_project(self.job.id)

    def test_bad_identifier_cannot_export_current_job(self):
        for value in ("../sketch", "", "f" * 32):
            with self.assertRaises(ValueError):
                self.manager.export_project(value)

    def test_file_limit_never_silently_truncates(self):
        with patch.object(projects, "MAX_PROJECT_FILES", 1):
            with self.assertRaisesRegex(ValueError, "incompleta"):
                self.manager.export_project(self.job.id)

    def test_size_limit_never_silently_truncates(self):
        with patch.object(projects, "MAX_PROJECT_BYTES", 4):
            with self.assertRaises(ValueError):
                self.manager.export_project(self.job.id)

    def test_auxiliary_credentials_block_external_agent_continuation(self):
        (self.folder / "radar_config.h").write_text('const char* key="sk-' + "x" * 40 + '";')
        with (
            patch.object(ar.shutil, "which", return_value="/fake/codex"),
            patch.object(self.manager, "_work"),
        ):
            with self.assertRaisesRegex(ValueError, "credenciales"):
                self.manager.start(
                    provider="codex",
                    mode="supervisado",
                    prompt="Continuar radar",
                    code="",
                    lang="cpp",
                    fqbn="esp32:esp32:esp32",
                    confirmed=True,
                    parent_job_id=self.job.id,
                )

    def test_workspace_outside_root_is_rejected(self):
        with tempfile.TemporaryDirectory() as outside:
            with self.assertRaises(ValueError):
                projects.collect_project(Path(outside), self.root)

    def test_export_after_restart_does_not_modify_original_journal(self):
        journal = self.folder / ar.JOURNAL_FILENAME
        before = journal.read_bytes()
        recovered = ar.AgentJobManager(self.root)
        self.assertTrue(recovered.export_project(self.job.id))
        self.assertEqual(journal.read_bytes(), before)

    def test_compile_receives_header_and_current_editor_code(self):
        builds = jobs.JobManager(threading.Lock(), self.root / "builds")
        observed = []

        def compile_stub(job, arguments, timeout):
            sketch = Path(arguments[-1])
            observed.append(
                (
                    (sketch / "radar_config.h").read_bytes(),
                    (sketch / "sketch.ino").read_text(encoding="utf-8"),
                )
            )
            return 0

        with patch.object(builds, "_run", side_effect=compile_stub):
            started = builds.start(
                "// código actual",
                "esp32:esp32:esp32",
                project_files={"sketch.ino": b"old", "radar_config.h": b"#define LCD_BL 32\n"},
                agent_project_id=self.job.id,
            )
            for _ in range(100):
                result = builds.status(started["job_id"])
                if not result["active"]:
                    break
                time.sleep(0.01)
        self.assertTrue(result["success"])
        self.assertEqual(observed, [(b"#define LCD_BL 32\n", "// código actual")])
        self.assertEqual(result["agent_project_id"], self.job.id)

    def test_compile_rejects_auxiliary_path_escape_before_running(self):
        builds = jobs.JobManager(threading.Lock())
        for name in ("../outside.h", "/outside.h", "C:/outside.h", "folder\\outside.h"):
            with self.assertRaises(ValueError):
                builds.start("", "esp32:esp32:esp32", project_files={name: b"bad"})


if __name__ == "__main__":
    unittest.main()
