"""Run the entire unit suite without reading original agent workspaces."""
import os
from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
with tempfile.TemporaryDirectory(prefix='makeride-tests-') as data:
    os.environ['AB_MAKERIDE_DATA_DIR'] = data
    suite=unittest.defaultTestLoader.discover(str(Path(__file__).parent))
    result=unittest.TextTestRunner(verbosity=2).run(suite)
sys.exit(not result.wasSuccessful())
