"""Full data pipeline: fetch -> contracts -> build -> validate.   uv run python -m pipelines.run_all"""
from pipelines import build, contracts, fetch, validate_artifacts

if __name__ == "__main__":
    fetch.main(); contracts.main(); build.main(); validate_artifacts.main()
