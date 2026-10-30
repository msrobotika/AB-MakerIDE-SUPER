"""Regression checks for extracted firmware-upload intent classification."""

import unittest

from ab_makeride.agent_intent import requests_upload
from ab_makeride.agent_runtime import requests_upload as runtime_requests_upload


class UploadIntentTests(unittest.TestCase):
    def test_public_runtime_api_still_reexports_identical_function(self):
        self.assertIs(runtime_requests_upload, requests_upload)

    def test_explicit_upload_commands(self):
        for prompt in ("subir", "grabar", "cargar", "upload", "flashea", "SUBELO"):
            with self.subTest(prompt=prompt):
                self.assertTrue(requests_upload(prompt))

    def test_negative_intent_and_non_upload_prompts(self):
        for prompt in (
            "no subir",
            "sin grabar",
            "no lo cargues",
            "no flashees",
            "solo compilar",
            "analizar codigo",
        ):
            with self.subTest(prompt=prompt):
                self.assertFalse(requests_upload(prompt))
