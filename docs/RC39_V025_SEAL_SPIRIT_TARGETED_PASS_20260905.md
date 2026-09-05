# RC39 v025 — SEAL_SPIRIT Targeted PASS — 2026-09-05

Status: **TARGETED PASS ONLY**. This evidence does **not** count as full campaign PASS or release LOCK.

## Immutable candidate under test

- Release ID: `383144921`
- Asset: `KELVOR_RC39_CAMPAIGN_PRESENTATION_INTEGRATION_CANDIDATE_v004_20260905.zip`
- Expected SHA-256: `77e50fde0ac6fc392237616d2842814a92a6d6d392a54487b38321c339b2d36e`

## Cloud run

- Workflow: `KELVOR RC39 v004 Targeted SEAL_SPIRIT Diagnostic`
- Run ID: `33977997220`
- Run number: `23`
- Head patch commit: `4f8cd32ebb31fa58e70b6fba886489514e7cbaf9`
- Artifact: `KELVOR-RC39-SEAL-SPIRIT-TARGETED-23`
- Artifact digest: `sha256:c62b6a45a5d3cb5f39c84473c9fe4b19e09be9ef54f47ebc01607049adb412e5`

## Result

- `result`: `TARGET_SEAL_COLLECTED`
- `target_id`: `SEAL_SPIRIT`
- elapsed: `30.61 s`
- seals after collection: `2`
- hearts: `3`
- damage count: `0`
- deaths: `0`
- life cycle: `active`

## Input-only route evidence

Arena-B optional slime preclear (`v024`):

- ordinary player movement / attack / spacing-jump only;
- slime remains real and its HP/damage rules are unchanged;
- `79` attack pulses recorded;
- no player damage recorded;
- preclear completed before the platform entry route.

Measured platform entry (`v025`):

- run-up ready near `x=21418`;
- primary jump near `x=21658`;
- normal air/double jump near `x=21771`;
- physical landing on the authored `21880` ledge near `x=21877 / y=131`;
- existing v018 stage-1 route then executed primary + double toward the second ledge / seal;
- `SEAL_SPIRIT` was physically collected near `x=22077`.

Runtime geometry used to justify the entry fix:

- authored platform center at `x=21880`: `y=133.60`;
- continuous-ground player center: about `y=254`;
- required rise: about `120.4 px`;
- a primary `-585` jump under gravity `1750` has only about `97.8 px` ideal ballistic rise;
- therefore the authored first ledge requires the normal air-jump mechanic; no physics constant was changed.

## Integrity statement

The v024/v025 candidates change only virtual player inputs / autoplay routing. They do not change player HP, enemy HP, damage, gravity, jump velocity, run speed, collision, hitboxes, platform geometry, seals, gates, saves, timers, acceptance thresholds or PASS rules.

The isolated diagnostic precollects `SEAL_DAWN`, opens prior gates and teleports the test instance only to isolate this target. Those operations are explicitly diagnostic-only and never count as campaign PASS.

## Next gate

Promote v024 + v025 to the natural terminal RC39 diagnostic. Only after natural full-campaign evidence should the original campaign runner / integrated Gauntlet be used for an acceptance verdict.
