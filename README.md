# KELVOR

Private CI/bootstrap repository for the KELVOR game project.

## Current canonical state — 2026-09-05

- Baseline technical save/persistence: **RC35** — preserved and immutable.
- W01_L01 reference candidate: **RC37** — preserved.
- Isolated 84-state QA: **v005 + HERO22 v010** — `84_TECHNICAL_PASS_CANDIDATE` reported from Windows; not a final visual/campaign/LOCK approval.
- Current campaign candidate: **RC39 Presentation Integration v004**.
- RC39 v004 SHA-256: `77e50fde0ac6fc392237616d2842814a92a6d6d392a54487b38321c339b2d36e`.
- v004 preservation audit: **614/614 v003 release files byte-identical**, with only two new runtime files added; no gameplay/assets/physics/HERO22 image changes.
- GitHub Windows infrastructure self-test: **PASS** — Windows Server runner + Headless Chrome reached `127.0.0.1` successfully.
- Master Gap current documentation before this GitHub promotion: **v022**; next docs revision records v004 + CI infrastructure PASS without promoting final gates.
- Release status: **NOT LOCKED**. Hostinger package remains staging until all real gates close.

## GitHub Actions

1. **KELVOR CI Bootstrap Self-Test** — proves Windows runner + Chrome headless can reach `127.0.0.1` without changing game criteria.
2. **KELVOR QA 84 - Windows** — runs the original QA v005 runner and uploads `RESULTADOS_84` as a GitHub Artifact.
3. **KELVOR RC39 v003 Campaign - Windows** — historical workflow preserved for the v003 candidate.
4. **KELVOR RC39 v004 Campaign - Windows** — current campaign workflow. Publishing a GitHub Release containing the exact v004 ZIP automatically downloads it with repository authentication, verifies SHA-256, runs the original v004 runner on `windows-latest`, and uploads `RESULTADOS_CAMPANHA_RC39_V004`.
5. **KELVOR Pages Preview** — on the same Release event, attempts to publish only the verified `web/` payload for mobile/browser preview when Pages is available for the repository.

The CI browser helper only opens the localhost URL requested by the original runner. It does **not** alter FPS gates, durations, physics, hitboxes, assets, animation timing, coverage rules, or verdict logic.

## Current Release asset required for automatic campaign QA

Exact file:

`KELVOR_RC39_CAMPAIGN_PRESENTATION_INTEGRATION_CANDIDATE_v004_20260905.zip`

Expected SHA-256:

`77e50fde0ac6fc392237616d2842814a92a6d6d392a54487b38321c339b2d36e`

Large ZIPs remain outside normal Git history. The current v004 campaign workflow can consume the exact ZIP as a private GitHub Release asset, so the repository does not need to expose the package publicly.

## Gate separation

A technical GitHub Actions PASS is **not** Owner QA, physical mobile QA, Hostinger production validation, or `LOCKED`. Those gates remain independent and must be evidenced separately.
