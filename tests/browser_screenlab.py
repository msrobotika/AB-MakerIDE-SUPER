"""Actual Chromium UI test for ScreenLab, no firmware upload or hardware access."""

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
    report = {"checks": [], "page_errors": [], "hardware_actions": []}

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

    with (
        tempfile.TemporaryDirectory() as tmp,
        patch.object(server, "AGENT_JOBS", AgentJobManager(Path(tmp) / "sessions")),
        patch.object(server, "MCP_SETTINGS", MCPSettings(Path(tmp) / "private" / "mcp.json")),
        patch.object(server, "board_catalog", return_value=catalog),
        patch.object(server, "scan_ports", ports),
        patch.object(server, "BOARD_IDENTIFICATION_ENABLED", False),
    ):
        http = server.ThreadingHTTPServer(("127.0.0.1", 0), server.IDEHandler)
        thread = threading.Thread(target=http.serve_forever, daemon=True)
        thread.start()
        try:
            with sync_playwright() as pw:
                browser = pw.chromium.launch(headless=True)
                page = browser.new_page(viewport={"width": 1536, "height": 1060})
                page.on("pageerror", lambda error: report["page_errors"].append(str(error)))

                def guard(route):
                    url = route.request.url
                    if any(p in url for p in ("/api/upload", "/api/build", "/api/agents/start")):
                        report["hardware_actions"].append(url)
                        route.fulfill(status=403, body="Action blocked in test")
                    else:
                        route.continue_()

                page.route("**/api/**", guard)
                page.goto(
                    "http://127.0.0.1:" + str(http.server_port), wait_until="domcontentloaded"
                )
                page.wait_for_function(
                    "() => typeof document.querySelector('#showScreenLab').onclick === 'function'"
                )
                previous_sketch = page.locator("#code").input_value()
                page.locator("#extraTools summary").click()
                page.locator("#showScreenLab").click()
                dlg = page.locator("#screenLabDialog")
                check("ScreenLab opens as advanced modal", dlg.evaluate("(el) => el.open"))
                check("two initial controls are visible", page.locator(".sl-widget").count() == 2)
                page.screenshot(
                    path=str(args.outputs / "screenlab-cyd-real.png"), full_page=True
                )
                page.locator('[data-sl-add="bar"]').click()
                check("bar is added", page.locator(".sl-bar").count() == 1)
                widget = page.locator(".sl-bar")
                old_x = float(widget.evaluate("(el)=>parseInt(el.style.left,10)"))
                bounds = widget.bounding_box()
                page.mouse.move(bounds["x"] + 15, bounds["y"] + 12)
                page.mouse.down()
                page.mouse.move(bounds["x"] + 51, bounds["y"] + 32, steps=4)
                page.mouse.up()
                new_x = float(page.locator(".sl-bar").evaluate("(el)=>parseInt(el.style.left,10)"))
                check("dragging moves and persists the component", new_x != old_x)
                page.locator("#slText").fill("Ancho de banda")
                page.locator("#slText").dispatch_event("change")
                page.locator("#slProfile").select_option("ideaspark")
                check(
                    "real IdeaSpark landscape design profile",
                    "240×135" in page.locator("#slCanvasInfo").inner_text(),
                )
                page.locator("#slGenerate").click()
                code = page.locator("#slCode").input_value()
                check(
                    "code generator outputs explicit LVGL UI only",
                    "lv_bar_create" in code
                    and "lv_obj_add_event_cb" in code
                    and "No display/touch driver included" in code,
                )
                check(
                    "no sketch was overwritten",
                    page.locator("#code").input_value() == previous_sketch,
                )
                page.screenshot(
                    path=str(args.outputs / "screenlab-ideaspark-real.png"), full_page=True
                )
                check("no device/agent operation invoked", not report["hardware_actions"])
                browser.close()
        finally:
            http.shutdown()
            http.server_close()
    (args.outputs / "report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    check("no JS errors", not report["page_errors"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
