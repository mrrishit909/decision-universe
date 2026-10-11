# Deployment (data layer)

Artifacts are static files in `site/public/data/` and ship with the Pages build. Regenerate with `uv run python -m pipelines.run_all` (needs network for the first fetch; raw data is gitignored). Publishing, repo creation and Pages are handled by the orchestrator after the release gate.
