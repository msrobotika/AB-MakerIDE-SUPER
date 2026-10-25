"""Regresiones de UX 0.9.2. No sustituyen pruebas E2E de Windows/hardware."""
from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text(encoding='utf-8')
JS=(ROOT/'app.js').read_text(encoding='utf-8')
class UX092Tests(unittest.TestCase):
    def test_resizable_terminal_accessible(self):
        self.assertIn('id="terminalGrip" role="separator"',HTML)
        self.assertIn('tabindex="0"',HTML)
        self.assertIn('aria-valuenow="165"',HTML)
    def test_terminal_maximizes_and_restores(self):
        self.assertIn('id="terminalMax"',HTML)
        self.assertIn('function toggleTerminalMax()',JS)
        self.assertIn("$('#terminalMax').addEventListener('click',toggleTerminalMax)",JS)
    def test_keyboard_resizing(self):
        self.assertIn("e.key==='ArrowUp'||e.key==='ArrowDown'",JS)
        self.assertIn("e.key==='Home'",JS)
        self.assertIn("e.key==='End'",JS)
        self.assertIn("e.ctrlKey&&e.altKey",JS)
    def test_clean_start_persists_ai_preferences_but_not_draft_or_layout(self):
        self.assertNotIn('localStorage.setItem(UI_STORAGE',JS)
        self.assertNotIn('localStorage.setItem(SAVEKEY',JS)
        self.assertIn('localStorage.setItem(AI_PREFERENCES',JS)

    def test_unknown_ch340_not_asserted_as_uno(self):
        self.assertIn('USB CH340 · modelo a elegir',JS)
        self.assertIn('confirma el modelo manualmente',JS)
        self.assertNotIn('state.fqbn=selected.boards[0].fqbn',JS)
    def test_guided_commands_not_arbitrary_shell(self):
        self.assertIn('Comandos guiados',HTML)
        self.assertIn('No es PowerShell',JS)
        self.assertIn('const allowedTerminal=',JS)
    def test_quick_start_present(self):
        self.assertIn('id="quickStart"',HTML)
        self.assertIn('id="quickBoardFocus"',HTML)
        self.assertIn("$('#quickHelp').onclick",JS)
    def test_auto_hide_deps_when_all_clear(self):
        self.assertIn("closest('.advisorstrip').classList.toggle('hidden'",JS)
    def test_port_is_selected_from_scan_instead_of_restoring_old_session(self):
        self.assertIn('state.port=ports[0].port',JS)
        self.assertNotIn("state.port=/^COM\\d+$/i.test(old.port||'')",JS)
        self.assertIn("desconectado / sin verificar",JS)
        self.assertNotIn("if(!state.ports.some(p=>p.port===state.port))state.port=''",JS)
