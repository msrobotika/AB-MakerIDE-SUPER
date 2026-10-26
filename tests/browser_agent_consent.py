"""Agent consent regression: real HTTP + Chromium, stub worker, no CLI/hardware.

Run in the local Playwright venv with --outputs pointing to an evidence folder.
Native confirm/prompt deliberately throw, matching the integrated browser bug.
"""

import argparse
import json
import difflib
import hashlib
import zipfile
from pathlib import Path
import sys
import tempfile
import threading
import time
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from playwright.sync_api import sync_playwright
from ab_makeride import agent_runtime
import server


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--outputs", type=Path, required=True)
    args = parser.parse_args()
    args.outputs.mkdir(parents=True, exist_ok=True)
    report = {
        "checks": [],
        "page_errors": [],
        "starts": [],
        "scope": "Real HTTP handler/consent validation/workspace; stub CLI worker. No hardware.",
    }

    def check(name, value):
        report["checks"].append({"name": name, "passed": bool(value)})
        if not value:
            raise AssertionError(name)

    def worker(_manager, job, executable, task):
        time.sleep(0.6)
        if task.startswith("PROJECT:"):
            report.setdefault("inherited_headers", []).append(
                (job.workspace / "radar_config.h").exists()
            )
            code = (
                '#include "radar_config.h"\n// PROJECT_GENERATED '
                + job.id[:8]
                + "\nvoid setup(){}\nvoid loop(){}\n"
            )
            (job.workspace / "radar_config.h").write_text("#define CONTROLLED_TEST 1\n")
            (job.workspace / job.file_name).write_text(code)
            job.modified_code = code
            job.diff = "".join(
                difflib.unified_diff(job.before.splitlines(True), code.splitlines(True))
            )
            job.changed_files = ["radar_config.h"]
        job.result = "CONTROLADO: tarea de prueba completada sin CLI ni hardware."
        job.exit_code = 0
        job.success = True
        if task.startswith("UPLOAD_PENDING:"):
            job.upload_requested = True
            job.success = False
            job.error = "Carga solicitada pendiente: no consta verificación de grabación."
        job.active = False
        job.emit(job.result)
        job.persist()

    def scan(*, diagnostics=False):
        return {"ports": [], "scan_ok": True, "scan_errors": []} if diagnostics else []

    catalog = {
        "ok": True,
        "boards": [{"fqbn": "arduino:avr:uno", "name": "Arduino Uno"}],
        "count": 1,
        "source": "CONTROLADO",
        "error": "",
        "warning": "",
    }
    real_which = agent_runtime.shutil.which

    def controlled_which(command, *args, **kwargs):
        # The stub worker never launches a CLI. Keep its availability controlled
        # too, so clean CI machines need neither an AI account nor a CLI install.
        if command in agent_runtime.PROVIDERS.values():
            return sys.executable
        return real_which(command, *args, **kwargs)

    try:
        with (
            tempfile.TemporaryDirectory() as temp,
            patch.object(server, "AGENT_JOBS", agent_runtime.AgentJobManager(Path(temp))),
            patch.object(agent_runtime.AgentJobManager, "_work", worker),
            patch.object(agent_runtime.shutil, "which", side_effect=controlled_which),
            patch.object(server, "scan_ports", scan),
            patch.object(server, "board_catalog", return_value=catalog),
        ):
            http = server.ThreadingHTTPServer(("127.0.0.1", 0), server.IDEHandler)
            thread = threading.Thread(target=http.serve_forever, daemon=True)
            thread.start()
            try:
                with sync_playwright() as pw:
                    browser = pw.chromium.launch(headless=True)
                    page = browser.new_page(viewport={"width": 1360, "height": 950})
                    page.on("pageerror", lambda error: report["page_errors"].append(str(error)))
                    page.add_init_script(
                        "window.prompt=()=>{throw Error('prompt() is not supported.')};window.confirm=()=>{throw Error('Native confirm disabled for regression')}"
                    )

                    def guard(route):
                        request = route.request
                        if request.method == "POST":
                            if "/api/agents/start" in request.url:
                                report["starts"].append(request.post_data_json)
                            elif not any(
                                path in request.url
                                for path in (
                                    "/api/advisor/check",
                                    "/api/agents/project/export",
                                    "/api/projects/import",
                                )
                            ):
                                raise AssertionError("Unexpected POST " + request.url)
                        route.continue_()

                    page.route("**/api/**", guard)

                    def approve_agent(*, enter=False):
                        # Closing a dialog resolves an async handler. Do not read
                        # the previous job's enabled button/status before the
                        # next POST has actually been accepted by the server.
                        with page.expect_response(
                            lambda response: (
                                response.request.method == "POST"
                                and response.url.endswith("/api/agents/start")
                            )
                        ) as started:
                            if enter:
                                page.locator("#agentConsentInput").press("Enter")
                            else:
                                page.locator("#agentConsentApprove").click()
                        response = started.value
                        if response.status != 200:
                            raise AssertionError(
                                "Controlled agent start rejected: " + response.text()
                            )
                        return response

                    page.goto(f"http://127.0.0.1:{http.server_port}")
                    page.wait_for_function(
                        '()=>document.querySelector("#backendState").textContent.includes("activo")'
                    )
                    if page.locator("body").get_attribute("data-right") != "ai":
                        page.locator("#showAI").click()
                    page.locator("[data-panel=agents]").click()
                    page.wait_for_function(
                        '()=>document.querySelector("#activityState") && document.querySelector("#activityPhases")'
                    )
                    print(
                        json.dumps(
                            {
                                "observer_initial_state": page.locator(
                                    "#activityState"
                                ).inner_text(),
                                "observer_initial_phases": page.locator(
                                    "#activityPhases"
                                ).inner_text(),
                                "observer_page_errors": report["page_errors"],
                            },
                            ensure_ascii=False,
                        )
                    )
                    check(
                        "agent activity sidebar opens without fake progress",
                        page.locator("#activityState").inner_text() == "Sin sesión"
                        and "No consta" in page.locator("#activityPhases").inner_text(),
                    )
                    page.locator("#agentWorkbench").evaluate("(e)=>e.open=true")
                    page.locator("#execTask").fill(
                        "CONTROLADO: comprobar autorización, sin hardware"
                    )
                    page.locator("#execMode").select_option("total")
                    page.locator("#execRun").click()
                    check(
                        "total opens in-page dialog with focus",
                        page.locator("#agentConsentInput").evaluate(
                            "(e)=>e===document.activeElement"
                        ),
                    )
                    check(
                        "blank consent cannot start",
                        not page.locator("#agentConsentApprove").is_enabled()
                        and not report["starts"],
                    )
                    page.locator("#agentConsentInput").fill("acepto")
                    check(
                        "incorrect consent cannot start",
                        not page.locator("#agentConsentApprove").is_enabled()
                        and not report["starts"],
                    )
                    page.locator("#agentConsentCancel").click()
                    page.wait_for_function(
                        '()=>document.querySelector("#execStatus").textContent.includes("cancelada")'
                    )
                    check(
                        "cancel starts nothing and explains outcome",
                        not report["starts"]
                        and "cancelada" in page.locator("#execStatus").inner_text(),
                    )
                    page.locator("#execRun").click()
                    page.locator("#agentConsentInput").press("Escape")
                    page.locator("#agentConsentDialog").wait_for(state="hidden")
                    check(
                        "Escape starts nothing",
                        not report["starts"]
                        and not page.locator("#agentConsentDialog").is_visible(),
                    )
                    page.locator("#execRun").click()
                    check(
                        "consent resets each task",
                        page.locator("#agentConsentInput").input_value() == "",
                    )
                    page.screenshot(path=str(args.outputs / "agent-consent-dialog.png"))
                    page.locator("#agentConsentInput").fill("ACCESO TOTAL")
                    check(
                        "exact consent enables start",
                        page.locator("#agentConsentApprove").is_enabled(),
                    )
                    approve_agent(enter=True)
                    page.wait_for_function(
                        '()=>document.querySelector("#robotStatus").dataset.state==="success"'
                    )
                    check(
                        "one total request reaches real validation",
                        len(report["starts"]) == 1
                        and report["starts"][0]["full_consent"] == "ACCESO TOTAL"
                        and report["starts"][0]["confirm"] is True,
                    )
                    check(
                        "backend creates completed total job",
                        server.AGENT_JOBS._current.mode == "total"
                        and server.AGENT_JOBS._current.success is True,
                    )
                    page.screenshot(path=str(args.outputs / "agent-consent-started-controlled.png"))
                    page.wait_for_function(
                        '()=>document.querySelector("#activityState").textContent.includes("CLI finalizada")'
                    )
                    check(
                        "left sidebar receives actual job result and tool activity",
                        page.locator("#activityProvider").inner_text() == "Codex"
                        and page.locator("#activityPhases").count() == 1
                        and page.locator("#activityTimeline li").count() > 0,
                    )
                    page.screenshot(
                        path=str(args.outputs / "agent-activity-sidebar-controlled.png")
                    )
                    page.locator("#execMode").select_option("consultar")
                    page.locator("#activityPrompt").fill(
                        "CONTROLADO: lectura mediante el panel izquierdo"
                    )
                    page.locator("#activityRun").click()
                    check(
                        "read-only hides full-access input",
                        not page.locator("#agentConsentInput").is_visible()
                        and page.locator("#agentConsentApprove").is_enabled(),
                    )
                    started = approve_agent()
                    check(
                        "read-only start accepted before checking completion", started.status == 200
                    )
                    page.wait_for_function(
                        '()=>document.querySelector("#robotStatus").dataset.state==="success"'
                    )
                    check(
                        "read-only request keeps permission scope",
                        len(report["starts"]) == 2
                        and report["starts"][1]["mode"] == "consultar"
                        and report["starts"][1]["full_consent"] == "",
                    )
                    page.set_viewport_size({"width": 390, "height": 844})
                    page.locator("#execMode").select_option("total")
                    page.locator("#execRun").click()
                    check(
                        "dialog usable on mobile",
                        page.locator("#agentConsentInput").is_visible()
                        and page.evaluate("document.documentElement.scrollWidth<=innerWidth"),
                    )
                    page.locator("#agentConsentCancel").click()
                    page.locator("#agentConsentDialog").wait_for(state="hidden")
                    page.set_viewport_size({"width": 1360, "height": 950})
                    original = page.locator("#code").input_value()
                    page.locator("#execMode").select_option("supervisado")
                    page.locator("#execTask").fill("PROJECT: generar código controlado")
                    page.locator("#execRun").click()
                    created = approve_agent()
                    page.wait_for_function(
                        '()=>document.querySelector("#code").value.includes("PROJECT_GENERATED")'
                    )
                    check(
                        "generated code automatically opens in editor",
                        "PROJECT_GENERATED" in page.locator("#code").input_value(),
                    )
                    if not page.locator("[data-panel=project]").evaluate(
                        '(e)=>e.classList.contains("on")'
                    ) or page.locator("#sidebar").evaluate(
                        '(e)=>e.classList.contains("is-collapsed")'
                    ):
                        page.locator("[data-panel=project]").click()
                    page.locator("#sideBody details").evaluate("(e)=>e.open=true")
                    page.evaluate("window.confirm=()=>true")
                    page.locator("#restoreAiBackup").click()
                    page.locator("#actionConfirmApprove").click()
                    page.wait_for_function(
                        '(value)=>document.querySelector("#code").value===value', arg=original
                    )
                    check(
                        "original editor code can be restored within session",
                        page.locator("#code").input_value() == original,
                    )
                    page.locator("#agentOpenCode").click()
                    page.locator("#actionConfirmApprove").click()
                    page.wait_for_function(
                        '()=>document.querySelector("#code").value.includes("PROJECT_GENERATED")'
                    )
                    parent = created.json()["job_id"]
                    check(
                        "save and open controls visible beside agent actions",
                        page.locator("#agentOpenCode").is_enabled()
                        and page.locator("#agentSaveProject").is_enabled(),
                    )
                    with page.expect_download() as event:
                        page.locator("#agentSaveProject").click()
                    exported = event.value
                    exported.save_as(str(args.outputs / "controlled-agent-project.zip"))
                    with zipfile.ZipFile(args.outputs / "controlled-agent-project.zip") as archive:
                        check(
                            "project download includes header and sketch",
                            "sketch/radar_config.h" in archive.namelist()
                            and "sketch/sketch.ino" in archive.namelist(),
                        )
                    page.locator("#code").fill(
                        page.locator("#code").input_value() + "\n// EDICION GUARDADA\n"
                    )
                    with page.expect_download() as saved:
                        page.locator("#exportBtn").click()
                    edited_zip = args.outputs / "edited-project.zip"
                    saved.value.save_as(str(edited_zip))
                    with zipfile.ZipFile(edited_zip) as archive:
                        check(
                            "manual save includes latest editor edits and auxiliaries",
                            b"EDICION GUARDADA" in archive.read("sketch/sketch.ino")
                            and "sketch/radar_config.h" in archive.namelist(),
                        )
                    count_before = len(report["starts"])
                    with page.expect_response(
                        lambda r: r.url.endswith("/api/projects/import")
                    ) as imported:
                        page.locator("#projectFile").set_input_files(str(edited_zip))
                        page.locator("#actionConfirmApprove").click()
                    parent = imported.value.json()["job_id"]
                    page.wait_for_function(
                        '()=>document.querySelector("#code").value.includes("EDICION GUARDADA")'
                    )
                    check(
                        "saved source ZIP reopens as editable project",
                        "EDICION GUARDADA" in page.locator("#code").input_value(),
                    )
                    check(
                        "opening saved ZIP never starts an agent",
                        len(report["starts"]) == count_before,
                    )
                    page.screenshot(
                        path=str(args.outputs / "agent-generated-editor-controlled.png")
                    )
                    page.locator("#execTask").fill("PROJECT: continuar y conservar mis ediciones")
                    page.locator("#execRun").click()
                    approve_agent()
                    page.locator("#code").fill("// edición del usuario durante la tarea")
                    page.wait_for_function('()=>!document.querySelector("#execRun").disabled')
                    page.wait_for_timeout(100)
                    check(
                        "continued task carries parent project reference",
                        report["starts"][-1]["parent_job_id"] == parent,
                    )
                    check(
                        "continued backend receives auxiliary header",
                        report["inherited_headers"][-1],
                    )
                    check(
                        "editing during task prevents automatic overwrite",
                        page.locator("#code").input_value()
                        == "// edición del usuario durante la tarea",
                    )
                    page.evaluate("window.confirm=()=>true")
                    page.locator("#agentOpenCode").click()
                    page.locator("#actionConfirmApprove").click()
                    page.wait_for_function(
                        '()=>document.querySelector("#code").value.includes("PROJECT_GENERATED")'
                    )
                    page.wait_for_function(
                        '()=>document.querySelector("#code").value.includes("PROJECT_GENERATED")'
                    )
                    if not page.locator("[data-panel=project]").evaluate(
                        '(e)=>e.classList.contains("on")'
                    ) or page.locator("#sidebar").evaluate(
                        '(e)=>e.classList.contains("is-collapsed")'
                    ):
                        page.locator("[data-panel=project]").click()
                    page.locator("#sideBody details").evaluate("(e)=>e.open=true")
                    page.evaluate("window.confirm=()=>true")
                    page.locator("#restoreAiBackup").click()
                    page.locator("#actionConfirmApprove").click()
                    page.wait_for_function(
                        '()=>document.querySelector("#code").value==="// edición del usuario durante la tarea"'
                    )
                    check(
                        "manual open preserves competing edit in session undo",
                        page.locator("#code").input_value()
                        == "// edición del usuario durante la tarea",
                    )
                    page.locator("#agentOpenCode").click()
                    page.locator("#actionConfirmApprove").click()
                    page.wait_for_function(
                        '()=>document.querySelector("#code").value.includes("PROJECT_GENERATED")'
                    )
                    manual_code = page.locator("#code").input_value()
                    page.locator("#agentAutoOpen").uncheck()
                    page.locator("#execTask").fill("PROJECT: conservar revisión manual")
                    page.locator("#execRun").click()
                    approve_agent()
                    page.wait_for_function('()=>!document.querySelector("#execRun").disabled')
                    page.wait_for_timeout(100)
                    check(
                        "automatic open can be disabled without losing generated project",
                        page.locator("#code").input_value() == manual_code
                        and page.locator("#agentSaveProject").is_enabled(),
                    )
                    page.locator("#agentAutoOpen").check()
                    saved_code = "// sketch reutilizado\nvoid setup(){}\nvoid loop(){}\n"
                    reusable = Path(temp) / "Reutilizable.ino"
                    reusable.write_text(saved_code)
                    page.locator("#projectFile").set_input_files(str(reusable))
                    page.locator("#actionConfirmApprove").click()
                    page.wait_for_function(
                        '()=>document.querySelector("#code").value.includes("sketch reutilizado")'
                    )
                    check(
                        "saved ino can be reopened with Importar",
                        page.locator("#code").input_value().startswith("// sketch reutilizado"),
                    )
                    check(
                        "importing another sketch clears old agent project reference",
                        page.evaluate('localStorage.getItem("ab-makeride-agent-project-v1")')
                        is None,
                    )
                    page.locator("#agentTaskRadar").click()
                    page.locator("#actionConfirmApprove").click()
                    page.wait_for_function(
                        '()=>document.querySelector("#code").value.includes("RADAR IDEASPARK")'
                    )
                    check(
                        "radar opens in code editor without hardware action",
                        "Adafruit_ST7789" in page.locator("#code").input_value(),
                    )
                    check(
                        "radar selects ESP32 instead of Uno",
                        page.locator("#quickBoard").input_value() == "esp32:esp32:esp32",
                    )
                    page.screenshot(path=str(args.outputs / "radar-editor-controlled.png"))
                    check(
                        "Codex requires own account without included AI balance",
                        "propia cuenta" in page.locator("#execAccountNote").inner_text()
                        and "no incluye saldo" in page.locator("#execAccountNote").inner_text(),
                    )
                    page.locator("#execProvider").select_option("claude_code")
                    check(
                        "Claude is explicitly unvalidated experimental integration",
                        "experimental" in page.locator("#execAccountNote").inner_text()
                        and "pendiente de validación"
                        in page.locator("#execAccountNote").inner_text(),
                    )
                    page.locator("#execProvider").select_option("codex")
                    page.locator("#extraTools").evaluate("(e)=>e.open=true")
                    page.locator("#showTrials").click()
                    page.locator("#trialName").fill("IdeaSpark · prueba controlada")
                    page.locator("#trialNotes").fill(
                        "No se ha accedido al hardware en esta prueba."
                    )
                    page.locator("#trialSave").click()
                    page.wait_for_function(
                        '()=>document.querySelector("#trialStatus").textContent.startsWith("Prueba guardada")'
                    )
                    check(
                        "trial without a build records no tool evidence",
                        page.evaluate(
                            "JSON.parse(localStorage.getItem(BoardTrials.KEY))[0].tool.status"
                        )
                        == "not_run",
                    )
                    page.locator("#trialClose").click()
                    page.reload()
                    page.wait_for_function(
                        '()=>document.querySelector("#backendState").textContent.includes("activo")'
                    )
                    page.locator("#extraTools").evaluate("(e)=>e.open=true")
                    page.locator("#showTrials").click()
                    check(
                        "trial notebook survives reload",
                        "1 / 100" in page.locator("#trialCount").inner_text(),
                    )
                    source = hashlib.sha256(
                        page.locator("#code").input_value().encode("utf-8")
                    ).hexdigest()
                    job = {
                        "id": "a" * 32,
                        "action": "compile",
                        "success": True,
                        "active": False,
                        "exit_code": 0,
                        "source_sha256": source,
                        "fqbn": page.locator("#quickBoard").input_value(),
                        "port": "",
                        "agent_project_id": "",
                    }
                    page.route("**/api/jobs/status?**", lambda route: route.fulfill(json=job))
                    page.evaluate(
                        'localStorage.setItem("ab-makeride-last-build-v1","a".repeat(32))'
                    )
                    page.locator("#trialName").fill("IdeaSpark · compilación controlada")
                    page.locator("#trialSave").click()
                    page.wait_for_function(
                        '()=>document.querySelector("#trialStatus").textContent.includes("Compilación correcta")'
                    )
                    check(
                        "compile does not automatically confirm physical result",
                        page.evaluate(
                            "JSON.parse(localStorage.getItem(BoardTrials.KEY))[0].observation.state"
                        )
                        == "not_checked",
                    )
                    job.update(action="upload", port="COM4")
                    page.locator("#trialSave").click()
                    page.wait_for_function(
                        '()=>document.querySelector("#trialStatus").textContent.includes("otra revisión, placa o puerto")'
                    )
                    check(
                        "upload on different port is not attributed to selected target",
                        page.evaluate(
                            "JSON.parse(localStorage.getItem(BoardTrials.KEY))[0].tool.status"
                        )
                        == "mismatch",
                    )
                    with page.expect_download() as download:
                        page.locator("#trialExport").click()
                    archive_path = args.outputs / "board-trials-controlled.json"
                    download.value.save_as(str(archive_path))
                    exported = json.loads(archive_path.read_text(encoding="utf-8"))
                    check(
                        "notebook export preserves separate tool and user observations",
                        len(exported["records"]) == 3
                        and all("tool" in r and "observation" in r for r in exported["records"]),
                    )
                    page.screenshot(path=str(args.outputs / "board-trials-controlled.png"))
                    page.route(
                        "**/api/jobs/status?**",
                        lambda route: route.fulfill(
                            status=400, json={"ok": False, "error": "Operación no encontrada"}
                        ),
                    )
                    page.locator("#trialObservation").select_option("works")
                    page.locator("#trialSave").click()
                    page.wait_for_function(
                        '()=>document.querySelector("#trialStatus").textContent.includes("no recuperable")'
                    )
                    check(
                        "lost server job preserves manual observation without inventing tool evidence",
                        page.evaluate(
                            "JSON.parse(localStorage.getItem(BoardTrials.KEY))[0].tool.status"
                        )
                        == "unavailable"
                        and page.evaluate(
                            "JSON.parse(localStorage.getItem(BoardTrials.KEY))[0].observation.state"
                        )
                        == "works",
                    )
                    saved = page.evaluate("localStorage.getItem(BoardTrials.KEY)")
                    page.evaluate('localStorage.setItem(BoardTrials.KEY,"[")')
                    page.locator("#trialSave").click()
                    page.wait_for_function(
                        '()=>document.querySelector("#trialStatus").textContent.includes("Otra pestaña")'
                    )
                    check(
                        "another tab cannot be overwritten by stale notebook",
                        page.evaluate("localStorage.getItem(BoardTrials.KEY)") == "[",
                    )
                    page.locator("#trialClose").click()
                    page.locator("#extraTools").evaluate("(e)=>e.open=true")
                    page.locator("#showTrials").click()
                    check(
                        "damaged notebook prevents overwriting original",
                        page.locator("#trialSave").is_disabled()
                        and page.evaluate("localStorage.getItem(BoardTrials.KEY)") == "[",
                    )
                    page.evaluate("(raw)=>localStorage.setItem(BoardTrials.KEY,raw)", saved)
                    page.locator("#trialClose").click()
                    page.set_viewport_size({"width": 390, "height": 844})
                    page.locator("#extraTools").evaluate("(e)=>e.open=true")
                    page.locator("#showTrials").click()
                    check(
                        "trial dialog fits mobile without horizontal scrolling",
                        page.locator("#boardTrialsDialog").evaluate(
                            "(e)=>e.scrollWidth<=e.clientWidth && e.getBoundingClientRect().right<=innerWidth"
                        ),
                    )
                    page.screenshot(path=str(args.outputs / "board-trials-mobile-controlled.png"))
                    page.locator("#trialClose").click()
                    check("no native-popup exceptions", not report["page_errors"])
                    page.set_viewport_size({"width": 1360, "height": 950})
                    if page.locator("body").get_attribute("data-right") != "ai":
                        page.locator("#showAI").click()
                    page.locator("#agentWorkbench").evaluate("(e)=>e.open=true")
                    page.locator("#execMode").select_option("supervisado")
                    page.locator("#execTask").fill(
                        "UPLOAD_PENDING: crea y sube el juego a la placa"
                    )
                    page.locator("#execRun").click()
                    approve_agent()
                    page.wait_for_function(
                        '()=>document.querySelector("#agentResumeMessage").textContent.includes("Carga solicitada pendiente")'
                    )
                    check(
                        "requested upload without verification remains pending in UI",
                        "incompleta" in page.locator("#agentResumeMessage").inner_text(),
                    )
                    check(
                        "missing requested upload never turns robot green",
                        page.locator("#robotStatus").get_attribute("data-state") == "failed",
                    )
                    page.screenshot(path=str(args.outputs / "upload-pending-controlled.png"))
                    browser.close()
            finally:
                http.shutdown()
                http.server_close()
        report["passed"] = True
    except Exception as error:
        report["passed"] = False
        report["failure"] = str(error)
        raise
    finally:
        (args.outputs / "agent-consent-checks.json").write_text(
            json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        print(
            json.dumps(
                {
                    "passed": report.get("passed"),
                    "checks": len(report["checks"]),
                    "failure": report.get("failure"),
                }
            )
        )


if __name__ == "__main__":
    main()
