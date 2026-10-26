from pathlib import Path
import subprocess
import unittest


class SimulatorRegression(unittest.TestCase):
    def test_timeline_and_rejection_contract(self):
        root = Path(__file__).resolve().parents[1]
        result = subprocess.run(
            ["node", "--test", "tests/simulator.test.cjs"], cwd=root, capture_output=True, text=True
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
