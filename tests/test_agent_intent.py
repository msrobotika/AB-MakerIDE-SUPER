"""Regression checks for extracted firmware-upload intent classification."""

from ab_makeride.agent_intent import requests_upload
from ab_makeride.agent_runtime import requests_upload as runtime_requests_upload


def test_public_runtime_api_still_reexports_identical_function():
    assert runtime_requests_upload is requests_upload


def test_explicit_upload_commands():
    for prompt in ("subir", "grabar", "cargar", "upload", "flashea", "SUBELO"):
        assert requests_upload(prompt), prompt


def test_negative_intent_and_non_upload_prompts():
    for prompt in (
        "no subir",
        "sin grabar",
        "no lo cargues",
        "no flashees",
        "solo compilar",
        "analizar codigo",
    ):
        assert not requests_upload(prompt), prompt
