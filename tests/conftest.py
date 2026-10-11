import json
import pytest
from pipelines.common import PUBLIC


@pytest.fixture(scope="session")
def art():
    return lambda n: json.loads((PUBLIC / f"{n}.json").read_text())
