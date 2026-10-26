"""Clean browser startup and real CLI routing. No CLI, serial or cloud execution."""

import argparse
import json
from pathlib import Path
import sys
import tempfile
import threading
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from playwright.sync_api import sync_playwright
import server
from ab_makeride.agent_runtime import AgentJobManager


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--outputs", type=Path, required=True)
    args = parser.parse_args()
    args.outputs.mkdir(parents=True, exist_ok=True)
    report = {
        "checks": [],
        "requests": [],
        "page_errors": [],
        "scope": "Real HTTP and Chromium, controlled empty board catalog. No agent, cloud, serial or firmware execution.",
    }

    def check(name, condition):
        report["checks"].append({"name": name, "passed": bool(condition)})
        if not condition:
            raise AssertionError(name)

    catalog = {
        "ok": True,
        "boards": [{"fqbn": "arduino:avr:uno", "name": "Arduino Uno"}],
        "count": 1,
        "source": "CONTROLLED",
        "error": "",
        "warning": "",
    }

    def ports(*, diagnostics=False):
        return {"ports": [], "scan_ok": True, "scan_errors": []} if diagnostics else []

    try:
        with (
            tempfile.TemporaryDirectory() as temp,
            patch.object(server, "AGENT_JOBS", AgentJobManager(Path(temp) / "sessions")),
            patch.object(server, "board_catalog", return_value=catalog),
            patch.object(server, "scan_ports", ports),
            patch.object(server, "BOARD_IDENTIFICATION_ENABLED", False),
        ):
            http = server.ThreadingHTTPServer(("127.0.0.1", 0), server.IDEHandler)
            threading.Thread(target=http.serve_forever, daemon=True).start()
            try:
                with sync_playwright() as pw:
                    browser = pw.chromium.launch(headless=True)
                    page = browser.new_page(viewport={"width": 1440, "height": 1000})
                    page.on("pageerror", lambda e: report["page_errors"].append(str(e)))
                    page.on("dialog", lambda dialog: dialog.accept())

                    def guard(route):
                        request = route.request
                        report["requests"].append(
                            {"method": request.method, "path": request.url.split("/api/")[-1]}
                        )
                        if request.method == "POST" and not request.url.endswith(
                            "/api/advisor/check"
                        ):
                            route.abort()
                            raise AssertionError("Unexpected action " + request.url)
                        route.continue_()

                    page.route("**/api/**", guard)
                    page.add_init_script("""if(!localStorage.getItem('ab-makeride-ai-preferences-v1')){
                     localStorage.setItem('ab-makeride-ai-preferences-v1',JSON.stringify({provider:'codex',model:'default',agent:'codex',mode:'total'}));
                     localStorage.setItem('ab-makeride-project-v2',JSON.stringify({name:'Trabajo conservado',lang:'cpp',fqbn:'arduino:avr:uno',files:{cpp:'// COPIA DEL PROYECTO\\nvoid setup(){} void loop(){}',py:'# copia'}}));
                     localStorage.setItem('ab-makeride-last-agent-v094','a'.repeat(32));
                     localStorage.setItem('ab-makeride-last-build-v1','b'.repeat(32));
                    }""")
                    page.goto("http://127.0.0.1:" + str(http.server_port))
                    page.wait_for_function(
                        '()=>document.querySelector("#aiProvider").value==="codex"&&document.querySelector("#backendState").textContent.includes("activo")'
                    )
                    check(
                        "provider and agent preference restored",
                        page.locator("#aiProvider").input_value() == "codex"
                        and page.locator("#execProvider").input_value() == "codex",
                    )
                    check(
                        "saved mode is a preference without execution",
                        page.locator("#execMode").input_value() == "total"
                        and not page.locator("#agentConsentDialog").is_visible(),
                    )
                    check(
                        "opening IDE has neutral robot",
                        page.locator("#robotStatus").get_attribute("data-state") == "idle",
                    )
                    check(
                        "old tasks and results are not loaded",
                        page.locator("#execTask").input_value() == ""
                        and page.locator("#chatLog").inner_text() == "",
                    )
                    check(
                        "editor starts empty despite legacy project",
                        page.locator("#code").input_value() == "",
                    )
                    check(
                        "legacy code remains recoverable without automatic loading",
                        "COPIA DEL PROYECTO"
                        in page.evaluate(
                            'localStorage.getItem("ab-makeride-before-clean-start-v1")'
                        ),
                    )
                    page.locator("#code").fill("// GUARDADO MANUAL\nvoid setup(){} void loop(){}")
                    check(
                        "old agent and build are not polled",
                        not any(
                            "agents/history" in r["path"]
                            or "agents/poll" in r["path"]
                            or "jobs/status" in r["path"]
                            for r in report["requests"]
                        ),
                    )
                    if page.locator("body").get_attribute("data-right") != "ai":
                        page.locator("#showAI").click()
                    page.locator("#chatInput").fill(
                        "Crea Space Invaders en CYD y sube el firmware a la placa"
                    )
                    page.locator("#chatSend").click()
                    page.locator("#agentConsentDialog").wait_for(state="visible")
                    check(
                        "Codex chat routes to real task consent",
                        "Space Invaders" in page.locator("#execTask").input_value(),
                    )
                    check(
                        "full access still requires explicit per-run consent",
                        page.locator("#agentConsentInput").is_visible()
                        and not page.locator("#agentConsentApprove").is_enabled(),
                    )
                    check(
                        "chat does not invoke read-only cloud substitute",
                        not any(
                            "ai/chat" in r["path"] or "agents/start" in r["path"]
                            for r in report["requests"]
                        ),
                    )
                    check(
                        "task declares CYD profile to the agent",
                        page.locator("#execHardware").input_value() == "esp32-cyd-28",
                    )
                    page.locator("#agentConsentCancel").click()
                    page.locator("#projectWizard").evaluate("(e)=>e.open=true")
                    page.locator("#wizardGoal").fill("ANTIGUO OBJETIVO")
                    page.locator("#chatInput").fill("INDICACION ANTIGUA")
                    page.locator("#execProvider").select_option("claude_code")
                    with page.expect_download() as downloaded:
                        page.locator("#code").press("Control+s")
                    saved_path = Path(temp) / "manual.abmaker.json"
                    downloaded.value.save_as(str(saved_path))
                    check(
                        "Ctrl S explicitly downloads current code",
                        "GUARDADO MANUAL"
                        in json.loads(saved_path.read_text(encoding="utf-8"))["files"][
                            "sketch.ino"
                        ],
                    )
                    check(
                        "draft is not automatically stored in browser",
                        "GUARDADO MANUAL"
                        not in page.evaluate('localStorage.getItem("ab-makeride-project-v2")'),
                    )
                    page.reload()
                    page.wait_for_function(
                        '()=>document.querySelector("#execProvider").value==="claude_code"'
                    )
                    check("reopen clears unsaved code", page.locator("#code").input_value() == "")
                    page.locator("#projectFile").set_input_files(str(saved_path))
                    page.locator("#actionConfirmApprove").click()
                    page.wait_for_function(
                        '()=>document.querySelector("#code").value.includes("GUARDADO MANUAL")'
                    )
                    check(
                        "user can reopen explicitly saved code",
                        "GUARDADO MANUAL" in page.locator("#code").input_value(),
                    )
                    check(
                        "reopen clears task, chat and wizard",
                        all(
                            page.locator("#" + name).input_value() == ""
                            for name in [
                                "execTask",
                                "chatInput",
                                "wizardGoal",
                                "wizardParts",
                                "wizardConstraints",
                            ]
                        ),
                    )
                    check(
                        "reopen retains only AI preference from task controls",
                        page.locator("#execProvider").input_value() == "claude_code"
                        and page.locator("#aiProvider").input_value() == "codex"
                        and page.locator("#execMode").input_value() == "total",
                    )
                    saved = json.loads(
                        page.evaluate('localStorage.getItem("ab-makeride-ai-preferences-v1")')
                    )
                    check(
                        "AI preferences never contain prompts or API keys",
                        set(saved) == {"provider", "model", "agent", "mode", "autoOpen"},
                    )
                    check(
                        "reopen does not grant PC companion permission",
                        not page.locator("#execAllowPC").is_checked(),
                    )
                    check("no JavaScript errors", not report["page_errors"])
                    page.screenshot(path=str(args.outputs / "clean-start-controlled.png"))
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
