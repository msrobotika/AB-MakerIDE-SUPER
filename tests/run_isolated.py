"""Run the entire unit suite without reading original agent workspaces."""

import os
from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
if sys.platform == "darwin":
    # Apple's standard /var temporary path is an OS alias for /private/var.
    # Give fixtures its canonical path; keep all runtime link guards intact.
    tempfile.tempdir = str(Path(tempfile.gettempdir()).resolve(strict=True))
with tempfile.TemporaryDirectory(prefix="makeride-tests-") as data:
    os.environ["AB_MAKERIDE_DATA_DIR"] = data
    suite = unittest.defaultTestLoader.discover(str(Path(__file__).parent))
    result = unittest.TextTestRunner(verbosity=2).run(suite)
sys.exit(not result.wasSuccessful())
