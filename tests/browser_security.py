"""Real Chromium/HTTP: CSP, hostile text and one-shot manual approval. No agent/hardware."""

import argparse
import io
import json
from pathlib import Path
import sys
import tempfile
import threading
import types
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from playwright.sync_api import sync_playwright
from ab_makeride.agent_runtime import AgentJob, AgentJobManager
from ab_makeride.codex_session import CodexSession
from ab_makeride.mcp_bridge import MCPSettings
import server


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--outputs", type=Path, required=True)
    args = parser.parse_args()
    args.outputs.mkdir(parents=True, exist_ok=True)
    report = {
        "checks": [],
        "page_errors": [],
        "scope": "Real Chromium and HTTP. Fake Codex approval request/session, hostile catalog/project/code strings. No CLI, MCP server, serial or firmware execution.",
    }

    def check(name, condition):
        report["checks"].append({"name": name, "passed": bool(condition)})
        if not condition:
            raise AssertionError(name)

    hostile = '<img src=x onerror="window.__xss=true">'
    catalog = {
        "ok": True,
        "boards": [{"fqbn": "arduino:avr:uno", "name": hostile}],
        "count": 1,
        "source": "CONTROLLED",
        "error": "",
        "warning": "",
    }

    def ports(*, diagnostics=False):
        return {"ports": [], "scan_ok": True, "scan_errors": []} if diagnostics else []

    try:
        with tempfile.TemporaryDirectory() as temp:
            manager = AgentJobManager(Path(temp) / "sessions")
            settings = MCPSettings(Path(temp) / "private/mcp.json")
            settings.save({"mcpServers": {"probe": {"command": "not-executed-fixture"}}})
            pipe = io.StringIO()
            starts = []

            def controlled_start(**kwargs):
                starts.append(kwargs)
                folder = Path(temp) / "sessions/sesion-fixture"
                folder.mkdir(parents=True, exist_ok=True)
                job = AgentJob("a" * 32, "codex", "autonomo", folder, "sketch.ino", "")
                job.app_session = CodexSession(job, types.SimpleNamespace(stdin=pipe), "fixture")
                manager._current = job
                job.app_session.handle(
                    {
                        "id": 31,
                        "method": "mcpServer/elicitation/request",
                        "params": {
                            "mode": "form",
                            "message": hostile,
                            "requestedSchema": {"type": "object", "properties": {}},
                            "_meta": {"tool_params": {"query": hostile}},
                        },
                    }
                )
                return {"ok": True, "job_id": job.id, "workspace": "CONTROLLED fixture"}

            with (
                patch.object(server, "AGENT_JOBS", manager),
                patch.object(manager, "start", side_effect=controlled_start),
                patch.object(server, "MCP_SETTINGS", settings),
                patch.object(server, "board_catalog", return_value=catalog),
                patch.object(server, "scan_ports", ports),
                patch.object(server, "BOARD_IDENTIFICATION_ENABLED", False),
            ):
                http = server.ThreadingHTTPServer(("127.0.0.1", 0), server.IDEHandler)
                threading.Thread(target=http.serve_forever, daemon=True).start()
                try:
                    with sync_playwright() as pw:
                        browser = pw.chromium.launch(headless=True)
                        page = browser.new_page(viewport={"width": 1440, "height": 1100})
                        page.on("pageerror", lambda error: report["page_errors"].append(str(error)))
                        page.add_init_script(
                            "window.__policyViolations=[];document.addEventListener('securitypolicyviolation',e=>window.__policyViolations.push(e.violatedDirective));"
                        )
                        response = page.goto("http://127.0.0.1:" + str(http.server_port))
                        page.wait_for_function(
                            '()=>document.querySelector("#backendState").textContent.includes("activo")'
                        )
                        policy = response.headers["content-security-policy"]
                        check(
                            "CSP has no unsafe-inline",
                            "unsafe-inline" not in policy and "style-src-attr 'none'" in policy,
                        )
                        check(
                            "all feature modules loaded without JS errors",
                            not report["page_errors"],
                        )
                        check(
                            "static HTML has no inline styles", page.locator("[style]").count() == 1
                        )  # terminal size is set with numeric CSSOM properties.
                        page.locator("#code").fill(hostile + "\nvoid setup(){} void loop(){}")
                        check(
                            "code highlighter uses text nodes",
                            page.locator("#highlight img").count() == 0
                            and hostile in page.locator("#highlight").inner_text(),
                        )
                        page.locator("#projectName").fill(hostile)
                        page.locator('.rail button[data-panel="boards"]').click()
                        check(
                            "hostile board name is an option text",
                            hostile in page.locator("#boardSelect").inner_text()
                            and page.locator("#sideBody img").count() == 0,
                        )
                        page.locator('.rail button[data-panel="project"]').click()
                        check(
                            "project name survives render as a value",
                            page.locator("#projectName").input_value() == hostile
                            and page.locator("#sideBody img").count() == 0,
                        )
                        page.locator("#terminalGrip").press("ArrowUp")
                        check(
                            "terminal resize works under strict CSP",
                            page.locator("#terminalGrip").get_attribute("aria-valuenow") != "165",
                        )
                        page.locator("#code").fill(
                            "void setup(){pinMode(13,OUTPUT);}void loop(){digitalWrite(13,HIGH);delay(500);digitalWrite(13,LOW);delay(500);}"
                        )
                        page.locator("#extraTools").click()
                        page.locator("#showSim").click()
                        page.locator("#simNext").click()
                        check(
                            "simulation works with external CSS",
                            "500 ms" in page.locator("#simClock").inner_text(),
                        )
                        page.locator("#showAI").click()
                        page.locator("#agentWorkbench").evaluate("(element)=>element.open=true")
                        page.locator("#execMode").select_option("autonomo")
                        page.locator("#execUseMCP").check()
                        check(
                            "MCP approval defaults to manual",
                            not page.locator("#execAutoMCP").is_checked(),
                        )
                        page.locator("#execTask").fill(
                            "Controlled fixture tool request; no hardware"
                        )
                        page.locator("#execRun").click()
                        page.locator("#agentConsentDialog").wait_for(state="visible")
                        check(
                            "task consent describes manual approvals",
                            "Aprobación manual"
                            in page.locator("#agentConsentSummary").inner_text(),
                        )
                        page.locator("#agentConsentApprove").click()
                        page.get_by_role("button", name="Autorizar esta vez", exact=True).wait_for(
                            state="visible"
                        )
                        check(
                            "no approval is sent automatically",
                            pipe.getvalue() == "" and starts[0]["mcp_auto_approve"] is False,
                        )
                        check(
                            "approval arguments render as inert text",
                            page.locator("#agentApprovals img").count() == 0
                            and hostile in page.locator("#agentApprovals").inner_text(),
                        )
                        check(
                            "waiting for approval remains amber",
                            page.locator("#robotStatus").get_attribute("data-state") == "working",
                        )
                        approval_id = manager._current.pending_approvals[0]["id"]
                        page.get_by_role("button", name="Autorizar esta vez", exact=True).click()
                        page.wait_for_function(
                            '()=>document.querySelector("#agentApprovals").children.length===0'
                        )
                        check(
                            "one explicit click answers exactly one request",
                            len(pipe.getvalue().splitlines()) == 1
                            and json.loads(pipe.getvalue())["result"]
                            == {"action": "accept", "content": {}},
                        )
                        csrf = page.request.get(
                            "http://127.0.0.1:" + str(http.server_port) + "/api/session"
                        ).json()["csrf"]
                        replay = page.request.post(
                            "http://127.0.0.1:" + str(http.server_port) + "/api/agents/approve",
                            data={
                                "job_id": "a" * 32,
                                "approval_id": approval_id,
                                "decision": "allow",
                            },
                            headers={"X-AB-Session": csrf},
                        )
                        check(
                            "replay is rejected without another grant",
                            replay.status == 400 and len(pipe.getvalue().splitlines()) == 1,
                        )
                        manager._current.active = False
                        manager._current.success = True
                        manager._current.exit_code = 0
                        manager._current.result = "Controlled fixture completed"
                        page.wait_for_function('()=>!document.querySelector("#execRun").disabled')
                        check(
                            "no hostile string executed", page.evaluate("window.__xss===undefined")
                        )
                        check(
                            "no CSP violations during normal flows",
                            page.evaluate("window.__policyViolations.length===0"),
                        )
                        check("no JavaScript errors", not report["page_errors"])
                        page.screenshot(path=str(args.outputs / "security-controlled.png"))
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
