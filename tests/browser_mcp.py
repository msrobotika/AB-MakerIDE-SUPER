"""Real browser/HTTP MCP configuration and consent. No CLI or external server."""

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
from ab_makeride.mcp_bridge import MCPSettings


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--outputs", type=Path, required=True)
    args = parser.parse_args()
    args.outputs.mkdir(parents=True, exist_ok=True)
    report = {
        "checks": [],
        "page_errors": [],
        "scope": "Real Chromium and HTTP. Controlled empty ports/catalog. MCP configuration only; no agent or MCP processes, cloud requests, or hardware.",
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
            patch.object(server, "MCP_SETTINGS", MCPSettings(Path(temp) / "private" / "mcp.json")),
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
                    starts = []

                    def guard(route):
                        if route.request.url.endswith("/api/agents/start"):
                            starts.append(route.request.post_data_json)
                            route.fulfill(
                                status=400,
                                content_type="application/json",
                                body=json.dumps(
                                    {"ok": False, "error": "Controlled test: no agent launched"}
                                ),
                            )
                        else:
                            route.continue_()

                    page.route("**/api/**", guard)
                    page.goto("http://127.0.0.1:" + str(http.server_port))
                    page.wait_for_function(
                        '()=>document.querySelector("#backendState").textContent.includes("activo")'
                    )
                    check(
                        "MCP is opt-in on fresh startup",
                        not page.locator("#execUseMCP").is_checked(),
                    )
                    check(
                        "MCP automatic approvals default to off",
                        not page.locator("#execAutoMCP").is_checked(),
                    )
                    page.locator("#mcpPanel").evaluate("(e)=>e.open=true")
                    page.locator("#mcpStatus").get_by_text(
                        "Sin MCP configurados", exact=False
                    ).wait_for()
                    config = {
                        "mcpServers": {
                            "local_docs": {
                                "command": "not-executed-test-fixture",
                                "env": {"KEY": "private-example"},
                            }
                        }
                    }
                    page.locator("#mcpConfig").fill(json.dumps(config))
                    page.locator("#mcpSave").click()
                    page.wait_for_function(
                        '()=>document.querySelector("#mcpStatus").textContent.includes("local_docs")'
                    )
                    check(
                        "saving clears credential-bearing text area",
                        page.locator("#mcpConfig").input_value() == "",
                    )
                    check(
                        "saved status never claims a working connection",
                        "Conexión aún no comprobada" in page.locator("#mcpStatus").inner_text(),
                    )
                    check(
                        "credentials not echoed to page",
                        "private-example" not in page.locator("body").inner_text(),
                    )
                    check(
                        "configuration saved outside project folders",
                        server.MCP_SETTINGS.status()["persistent"]
                        == (Path(temp) / "private" / "mcp.json").exists(),
                    )
                    check(
                        "saving starts no session",
                        not list((Path(temp) / "sessions").glob("sesion-*")),
                    )
                    page.reload()
                    page.wait_for_function(
                        '()=>document.querySelector("#backendState").textContent.includes("activo")'
                    )
                    page.locator("#mcpPanel").evaluate("(e)=>e.open=true")
                    page.wait_for_function(
                        '()=>document.querySelector("#mcpStatus").textContent.includes("local_docs")'
                    )
                    check(
                        "configuration persists but task permission resets",
                        not page.locator("#execUseMCP").is_checked()
                        and page.locator("#mcpConfig").input_value() == "",
                    )
                    page.locator("#agentWorkbench").evaluate("(e)=>e.open=true")
                    page.locator("#execMode").select_option("consultar")
                    page.locator("#execUseMCP").check()
                    page.locator("#execTask").fill("Consulta los documentos de prueba")
                    page.locator("#execRun").click()
                    page.wait_for_timeout(150)
                    check(
                        "read-only task does not activate external MCP",
                        not starts and not page.locator("#agentConsentDialog").is_visible(),
                    )
                    page.locator("#execMode").select_option("autonomo")
                    page.locator("#execRun").click()
                    page.locator("#agentConsentDialog").wait_for(state="visible")
                    check(
                        "consent explicitly names selected MCP",
                        "local_docs" in page.locator("#agentConsentSummary").inner_text(),
                    )
                    check("consent is required before starting", not starts)
                    page.locator("#agentConsentApprove").click()
                    page.wait_for_function(
                        '()=>document.querySelector("#execStatus").textContent.includes("Controlled test")'
                    )
                    check(
                        "authorized request enables MCP explicitly",
                        len(starts) == 1
                        and starts[0]["use_mcp"] is True
                        and starts[0]["mcp_auto_approve"] is False,
                    )
                    check(
                        "task request never transports MCP credentials",
                        "private-example" not in json.dumps(starts),
                    )
                    page.reload()
                    page.wait_for_function(
                        '()=>document.querySelector("#backendState").textContent.includes("activo")'
                    )
                    check(
                        "reopen clears task and MCP activation",
                        page.locator("#execTask").input_value() == ""
                        and not page.locator("#execUseMCP").is_checked(),
                    )
                    check("no JavaScript errors", not report["page_errors"])
                    if page.locator("body").get_attribute("data-right") != "ai":
                        page.locator("#showAI").click()
                    page.locator("#aiConfig > summary").click()
                    page.locator("#aiProvider").select_option("google")
                    check(
                        "Gemini online offers the documented Flash models",
                        "gemini-3.8-flash" in page.locator("#aiModel").inner_text(),
                    )
                    check(
                        "free quota and chat-only scope are visible before configuration",
                        "cuota gratuita limitada" in page.locator("#aiAccountNote").inner_text()
                        and "no ejecuta herramientas MCP"
                        in page.locator("#aiAccountNote").inner_text(),
                    )
                    page.locator("#mcpPanel").evaluate("(e)=>e.open=true")
                    page.screenshot(path=str(args.outputs / "mcp-controlled.png"))
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
