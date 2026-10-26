"""Real HTTP/jobs/frontend, controlled uploader. Never opens serial or runs a CLI."""

import argparse
import hashlib
import json
from pathlib import Path
import sys
import tempfile
import threading
import time
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from playwright.sync_api import sync_playwright
from ab_makeride.jobs import JobManager
import server


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--outputs", type=Path, required=True)
    args = parser.parse_args()
    args.outputs.mkdir(parents=True, exist_ok=True)
    report = {
        "checks": [],
        "page_errors": [],
        "commands": [],
        "scope": "Real HTTP, jobs, journal and Chromium UI; controlled compile/upload outputs, COM999 only. No CLI, serial, firmware or AI execution.",
    }

    def check(name, value):
        report["checks"].append({"name": name, "passed": bool(value)})
        if not value:
            raise AssertionError(name)

    catalog = {
        "ok": True,
        "boards": [{"name": "CYD CONTROLADA", "fqbn": "esp32:esp32:jczn_2432s028r"}],
        "count": 1,
        "source": "CONTROLLED",
        "error": "",
        "warning": "",
    }

    def ports(*, diagnostics=False):
        value = [
            {
                "port": "COM999",
                "name": "CONTROLADO",
                "boards": [{"name": "CYD CONTROLADA", "fqbn": "esp32:esp32:jczn_2432s028r"}],
            }
        ]
        return {"ports": value, "scan_ok": True, "scan_errors": []} if diagnostics else value

    try:
        with tempfile.TemporaryDirectory() as temp:
            manager = JobManager(threading.Lock(), Path(temp) / "builds")

            def fake_run(job, command, timeout):
                report["commands"].append(command[1])
                if command[1] == "compile":
                    code = (job.journal.parent / "sketch.ino").read_text("utf-8")
                    if "BROKEN" in code:
                        job.emit("sketch.ino:1: error: CONTROLLED build failure", from_tool=True)
                        return 1
                    job.emit("Sketch uses 274164 bytes (20%)", from_tool=True)
                    return 0
                if command[command.index("-p") + 1] != "COM999":
                    raise AssertionError("Physical port forbidden")
                check("uploader requests verification", "--verify" in command)
                code = (job.journal.parent / "sketch.ino").read_text("utf-8")
                for percentage in ("0.0", "10.3", "92.8", "100.0"):
                    job.emit(
                        "Writing at 0x00010000 [====] " + percentage + "% 16384/158889 bytes...",
                        from_tool=True,
                    )
                    time.sleep(0.12)
                if "CANCEL_WAIT" in code:
                    deadline = time.monotonic() + 10
                    while not job.cancelled and time.monotonic() < deadline:
                        time.sleep(0.02)
                    return 1
                if "NO_VERIFICATION" not in code:
                    job.emit("Hash of data verified.", from_tool=True)
                job.emit("Hard resetting via RTS pin...", from_tool=True)
                return 0

            with (
                patch.object(server, "JOBS", manager),
                patch.object(server, "HARDWARE_LOCK", manager._hardware_lock),
                patch.object(
                    server.SERIAL, "start", side_effect=AssertionError("Physical serial forbidden")
                ) as serial_start,
                patch.object(
                    server.AGENT_JOBS,
                    "start",
                    side_effect=AssertionError("Agent execution forbidden"),
                ) as agent_start,
                patch.object(manager, "_run", side_effect=fake_run),
                patch.object(server, "board_catalog", return_value=catalog),
                patch.object(server, "scan_ports", ports),
                patch.object(server, "BOARD_IDENTIFICATION_ENABLED", False),
                patch.object(server, "arduino_cli", return_value="controlled-cli"),
            ):
                http = server.ThreadingHTTPServer(("127.0.0.1", 0), server.IDEHandler)
                threading.Thread(target=http.serve_forever, daemon=True).start()
                try:
                    with sync_playwright() as pw:
                        browser = pw.chromium.launch(headless=True)
                        page = browser.new_page(viewport={"width": 1440, "height": 1000})
                        page.on("pageerror", lambda error: report["page_errors"].append(str(error)))
                        page.add_init_script(
                            "window.confirm=()=>{throw Error('Native confirm unavailable')};window.prompt=()=>{throw Error('Native prompt unavailable')};"
                        )
                        page.goto("http://127.0.0.1:" + str(http.server_port))
                        page.wait_for_function(
                            '()=>document.querySelector("#backendState").textContent.includes("activo")&&document.querySelector("#quickPort").value==="COM999"'
                        )
                        code = 'void setup(){Serial.begin(115200);Serial.println("MAKER_TETRIS 1");}void loop(){}'
                        page.locator("#quickBoard").select_option("esp32:esp32:jczn_2432s028r")
                        page.locator("#code").fill(code)
                        check(
                            "serial-only game warns about black CYD screen",
                            "pantalla negra" in page.locator("#sketchTargetNotice").inner_text(),
                        )
                        page.locator("#uploadBtn").click()
                        check(
                            "manual upload opens in-page confirmation",
                            page.locator("#actionConfirm").is_visible(),
                        )
                        check(
                            "destination warning is inside hardware confirmation",
                            "USB/serie" in page.locator("#actionConfirmText").inner_text(),
                        )
                        check("opening confirmation executes nothing", not report["commands"])
                        page.keyboard.press("Escape")
                        page.locator("#actionConfirm").wait_for(state="hidden")
                        check("Escape cancels without uploading", not report["commands"])
                        page.locator("#uploadBtn").click()
                        with page.expect_response(
                            lambda response: response.url.endswith("/api/jobs/start")
                        ):
                            page.locator("#actionConfirmApprove").click()
                        page.wait_for_function(
                            '()=>document.querySelector("#buildStage").textContent.includes("finalizada")&&!document.querySelector("#uploadBtn").disabled'
                        )
                        status = manager._current.snapshot()
                        check(
                            "job reaches terminal state",
                            not status["active"] and status["exit_code"] == 0,
                        )
                        check(
                            "decimal uploader output reaches 100 percent", status["progress"] == 100
                        )
                        check(
                            "uploaded revision matches editor bytes",
                            status["source_sha256"] == hashlib.sha256(code.encode()).hexdigest(),
                        )
                        check(
                            "verified bytes do not imply runtime observation",
                            status["flash_verified"] and not status["runtime_observed"],
                        )
                        check(
                            "console renders final result",
                            "Grabación verificada" in page.locator("#pane-console").inner_text(),
                        )
                        check(
                            "physical test remains pending in interface",
                            "pendientes" in page.locator("#buildDetail").inner_text(),
                        )
                        check(
                            "verified upload scopes green status",
                            page.locator("#robotStatus").get_attribute("data-state") == "success",
                        )
                        page.screenshot(path=str(args.outputs / "manual-upload-controlled.png"))

                        page.locator("#code").fill(
                            "// NO_VERIFICATION\nvoid setup(){}void loop(){}"
                        )
                        page.locator("#uploadBtn").click()
                        with page.expect_response(
                            lambda response: response.url.endswith("/api/jobs/start")
                        ):
                            page.locator("#actionConfirmApprove").click()
                        page.wait_for_function(
                            '()=>document.querySelector("#buildStage").textContent.includes("finalizada")&&!document.querySelector("#uploadBtn").disabled'
                        )
                        check(
                            "zero exit alone does not mark bytes verified",
                            not manager._current.flash_verified,
                        )
                        check(
                            "missing verification does not turn robot green",
                            page.locator("#robotStatus").get_attribute("data-state") == "unknown",
                        )

                        before = report["commands"].count("upload")
                        page.locator("#code").fill("// BROKEN\nvoid setup(){}void loop(){}")
                        page.locator("#uploadBtn").click()
                        with page.expect_response(
                            lambda response: response.url.endswith("/api/jobs/start")
                        ):
                            page.locator("#actionConfirmApprove").click()
                        page.wait_for_function(
                            '()=>document.querySelector("#buildStage").textContent.includes("fallida")&&!document.querySelector("#uploadBtn").disabled'
                        )
                        check(
                            "compile failure prevents upload",
                            report["commands"].count("upload") == before,
                        )
                        check(
                            "compile error is terminal and red",
                            page.locator("#robotStatus").get_attribute("data-state") == "failed"
                            and not manager._current.active,
                        )

                        page.locator("#code").fill("// CANCEL_WAIT\nvoid setup(){}void loop(){}")
                        page.locator("#uploadBtn").click()
                        with page.expect_response(
                            lambda response: response.url.endswith("/api/jobs/start")
                        ):
                            page.locator("#actionConfirmApprove").click()
                        page.wait_for_function(
                            '()=>document.querySelector("#buildStage").textContent.includes("Grabando")'
                        )
                        check(
                            "serial send and agent execution are disabled during upload",
                            page.locator("#serialSend").is_disabled()
                            and page.locator("#execRun").is_disabled(),
                        )
                        address = "http://127.0.0.1:" + str(http.server_port)
                        csrf = page.request.get(address + "/api/session").json()["csrf"]
                        for endpoint, payload in (
                            ("/api/serial/start", {"port": "COM999", "baud": 115200}),
                            ("/api/agents/start", {"provider": "codex"}),
                        ):
                            response = page.request.post(
                                address + endpoint,
                                data=payload,
                                headers={"X-AB-Session": csrf},
                                timeout=1500,
                            )
                            check(
                                "busy endpoint rejects immediately: " + endpoint,
                                response.status == 400
                                and "otra operación" in response.json()["error"],
                            )
                        page.locator("#buildCancel").click()
                        page.locator("#actionConfirmApprove").click()
                        page.wait_for_function(
                            '()=>document.querySelector("#buildStage").textContent.includes("cancelada")&&!document.querySelector("#uploadBtn").disabled'
                        )
                        check(
                            "cancel releases hardware lock and closes job",
                            manager._current.cancelled
                            and not manager._current.active
                            and not manager._hardware_lock.locked(),
                        )
                        check(
                            "cancel never claims verification", not manager._current.flash_verified
                        )
                        check(
                            "blocked requests were never queued or executed",
                            serial_start.call_count == 0 and agent_start.call_count == 0,
                        )

                        for selector in ("#projectFile",):
                            project = Path(temp) / "manual.ino"
                            project.write_text(
                                "// REOPENED\nvoid setup(){}void loop(){}", encoding="utf-8"
                            )
                            page.locator(selector).set_input_files(str(project))
                            page.locator("#actionConfirmApprove").click()
                            page.wait_for_function(
                                '()=>document.querySelector("#code").value.includes("REOPENED")'
                            )
                        check(
                            "manual import works without native dialogs",
                            "REOPENED" in page.locator("#code").input_value(),
                        )
                        check("all manual flows have no JS errors", not report["page_errors"])
                        browser.close()
                finally:
                    http.shutdown()
                    http.server_close()
        report["passed"] = True
    except Exception as error:
        report.update(passed=False, failure=str(error))
        raise
    finally:
        (args.outputs / "checks.json").write_text(
            json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
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
