# KELVOR

Private CI/bootstrap repository for the KELVOR game project.

## Current canonical state — 2026-09-05

- Baseline technical save/persistence: **RC35** — preserved and immutable.
- W01_L01 reference candidate: **RC37** — preserved.
- Isolated 84-state QA: **v005 + HERO22 v010** — `84_TECHNICAL_PASS_CANDIDATE` reported from Windows; not a final visual/campaign/LOCK approval.
- Current campaign candidate: **RC39 Presentation Integration v003**.
- RC39 v003 SHA-256: `de512945b761a9423e68591e94b8bfad231498403a2aa253105cdbcebf324c86`.
- Master Gap current documentation: **v022**.
- Release status: **NOT LOCKED**. Hostinger package remains staging until all real gates close.

## GitHub Actions

This repository contains three operational workflows plus one infrastructure self-test:

1. **KELVOR CI Bootstrap Self-Test** — proves Windows runner + Chrome headless can reach `127.0.0.1` without changing game criteria.
2. **KELVOR QA 84 - Windows** — runs the original QA v005 runner and uploads `RESULTADOS_84` as a GitHub Artifact.
3. **KELVOR RC39 v003 Campaign - Windows** — runs the original integrated campaign runner and uploads `RESULTADOS_CAMPANHA_RC39_V003`.
4. **KELVOR Pages Preview** — publishes only the `web/` payload for mobile/browser preview when Pages is available.

The CI browser helper only opens the localhost URL requested by the original runner. It does **not** alter FPS gates, durations, physics, hitboxes, assets, animation timing, coverage rules, or verdict logic.

## Large input artifacts

Large ZIPs are intentionally kept out of normal Git history. Every workflow input is downloaded over HTTPS and rejected unless its SHA-256 matches the documented expected value. See `docs/INPUT_ASSET_POLICY.md`.

## Gate separation

A technical GitHub Actions PASS is **not** Owner QA, physical mobile QA, Hostinger production validation, or `LOCKED`. Those gates remain independent and must be evidenced separately.
