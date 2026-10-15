# Deployment (data layer)

Artifacts are static files in `site/public/data/` and ship with the Pages build. Regenerate with `uv run python -m pipelines.run_all` (needs network for the first fetch; raw data is gitignored). Publishing, repo creation and Pages are handled by the orchestrator after the release gate.

## Release

Repo `mrrishit909/decision-universe` (public), Pages from the `gh-pages` branch root via `scripts/deploy_site_pages.sh decision-universe`,
base path `/decision-universe/`. Verification: curl of the page and its stylesheet content type, a live smoke at 1440 and 390 (requests,
failures, console errors, external hosts), Lighthouse three times on mobile. Results are recorded in `docs/BUILD_STATUS.md`.
