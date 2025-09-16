import os
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.auth import verify_jwt


@pytest.fixture(scope="session", autouse=True)
def _set_env():
    os.environ.setdefault("ENABLE_REDACTION", "false")
    yield


@pytest.fixture
def client():
    app.dependency_overrides[verify_jwt] = lambda: {"sub": "test-user", "scope": "transcribe"}
    yield TestClient(app)
    app.dependency_overrides.clear()
