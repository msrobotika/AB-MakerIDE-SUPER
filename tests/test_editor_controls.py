"""Regresiones de UX 0.9.2. No sustituyen pruebas E2E de Windows/hardware."""

from frontend_source import frontend_text, compact

from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "index.html").read_text(encoding="utf-8")
JS = frontend_text(ROOT)


class UX092Tests(unittest.TestCase):
    def test_resizable_terminal_accessible(self):
        self.assertIn(compact('id="terminalGrip" role="separator"'), compact(HTML))
        self.assertIn(compact('tabindex="0"'), compact(HTML))
        self.assertIn(compact('aria-valuenow="165"'), compact(HTML))

    def test_terminal_maximizes_and_restores(self):
        self.assertIn(compact('id="terminalMax"'), compact(HTML))
        self.assertIn(compact("function toggleTerminalMax()"), compact(JS))
        self.assertIn(
            compact("$('#terminalMax').addEventListener('click',toggleTerminalMax)"), compact(JS)
        )

    def test_keyboard_resizing(self):
        self.assertIn(compact("e.key==='ArrowUp'||e.key==='ArrowDown'"), compact(JS))
        self.assertIn(compact("e.key==='Home'"), compact(JS))
        self.assertIn(compact("e.key==='End'"), compact(JS))
        self.assertIn(compact("e.ctrlKey&&e.altKey"), compact(JS))

    def test_clean_start_persists_ai_preferences_but_not_draft_or_layout(self):
        self.assertNotIn(compact("localStorage.setItem(UI_STORAGE"), compact(JS))
        self.assertNotIn(compact("localStorage.setItem(SAVEKEY"), compact(JS))
        self.assertIn(compact("localStorage.setItem(AI_PREFERENCES"), compact(JS))

    def test_unknown_ch340_not_asserted_as_uno(self):
        self.assertIn(compact("USB CH340 · modelo a elegir"), compact(JS))
        self.assertIn(compact("confirma el modelo manualmente"), compact(JS))
        self.assertNotIn(compact("state.fqbn=selected.boards[0].fqbn"), compact(JS))

    def test_guided_commands_not_arbitrary_shell(self):
        self.assertIn(compact("Comandos guiados"), compact(HTML))
        self.assertIn(compact("No es PowerShell"), compact(JS))
        self.assertIn(compact("allowedTerminal="), compact(JS))

    def test_quick_start_present(self):
        self.assertIn(compact('id="quickStart"'), compact(HTML))
        self.assertIn(compact('id="quickBoardFocus"'), compact(HTML))
        self.assertIn(compact("$('#quickHelp').onclick"), compact(JS))

    def test_auto_hide_deps_when_all_clear(self):
        self.assertIn(compact("closest('.advisorstrip').classList.toggle('hidden'"), compact(JS))

    def test_port_is_selected_from_scan_instead_of_restoring_old_session(self):
        self.assertIn(compact("state.port=ports[0].port"), compact(JS))
        self.assertNotIn(compact("state.port=/^COM\\d+$/i.test(old.port||'')"), compact(JS))
        self.assertIn(compact("desconectado / sin verificar"), compact(JS))
        self.assertNotIn(
            compact("if(!state.ports.some(p=>p.port===state.port))state.port=''"), compact(JS)
        )
