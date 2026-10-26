"""The Center of Agents must report real events without granting permissions."""
from pathlib import Path
import json
import subprocess
import unittest

ROOT = Path(__file__).resolve().parents[1]


class AgentFlowTest(unittest.TestCase):
    def test_left_rail_uses_existing_agent_permissions(self):
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        panel = (ROOT / "frontend" / "agent_activity.js").read_text(encoding="utf-8")
        agent = (ROOT / "frontend" / "agent.js").read_text(encoding="utf-8")
        self.assertIn('data-panel="agentflow"', html)
        self.assertIn("renderAgentFlowPanel", panel)
        self.assertIn("recoverAgentSession(false)", panel)
        self.assertIn("$('#execStop').click()", panel)
        self.assertIn("Ver diferencias (sin aplicar)", panel)
        self.assertNotIn("$('#agentOpenCode').click()", panel)
        self.assertIn("agentFlowSync?.(r)", agent)
        self.assertIn("agentFlowEvent?.(ev)", agent)
        self.assertIn("agentFlowReset?.()", agent)

    def test_event_labels_avoid_echoing_private_tool_output(self):
        code = """
import {summarizeAgentEvent as f} from './frontend/agent_activity.js';
const logs = [
  {id:1,kind:'log',text:'SECRET_TOKEN=abcdef'},
  {id:2,kind:'milestone',text:'Resumen de compilación observado en la salida de la herramienta.'},
  {id:3,kind:'log',text:'Comando terminado · salida 2'},
  {id:4,kind:'log',text:'Herramienta MCP servidor/herramienta · completed'},
];
console.log(JSON.stringify(logs.map(f)));
"""
        result = subprocess.run(
            ["node", "--input-type=module", "-e", code],
            cwd=ROOT, capture_output=True, text=True, timeout=12, check=True,
        )
        out = json.loads(result.stdout)
        self.assertNotIn("SECRET_TOKEN", json.dumps(out))
        self.assertEqual(out[1]["type"], "evidence")
        self.assertEqual(out[2]["type"], "warning")
        self.assertEqual(out[3]["type"], "tool")


if __name__ == "__main__":
    unittest.main()
