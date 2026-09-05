# RC39 v027 — Post-Dawn → SEAL_SPIRIT Targeted PASS — 2026-09-05

Status: **STRONG MID-ROUTE TARGETED PASS ONLY**. This does not count as full campaign PASS or release LOCK.

## Immutable candidate

- Release ID: `383144921`
- Asset: `KELVOR_RC39_CAMPAIGN_PRESENTATION_INTEGRATION_CANDIDATE_v004_20260905.zip`
- SHA-256: `77e50fde0ac6fc392237616d2842814a92a6d6d392a54487b38321c339b2d36e`

## Cloud run

- Workflow: `KELVOR RC39 v004 Targeted MID-ROUTE to SEAL_SPIRIT`
- Run ID: `33978878927`
- Run number: `28`
- Head: `ed23edd7a01b9f7e23ec9b50c96694bb673c5737`
- Artifact: `KELVOR-RC39-POST-DAWN-TO-SPIRIT-28`
- Artifact digest: `sha256:6d8abe2f1cf238f3407f6d4bdfbc1076d93527864935fe722d610ed3f3baff4c`

## Diagnostic isolation

The test starts at `x=13220`, precollects only `SEAL_DAWN`, and opens only `GATE_A` to isolate the full post-Dawn segment. `GATE_B` is **not** opened by the diagnostic and must be earned normally. The test can only return success when `SEAL_SPIRIT` becomes physically collected.

## Result

- result: `TARGET_SEAL_COLLECTED`
- elapsed: `62.09 s`
- seals: `2`
- hearts: `3`
- damageCount: `0`
- deaths: `0`
- checkpoints: `1`
- Gate A: open, 2/2
- Gate B: open naturally, 3 defeated / 2 required
- Gate C: closed

## Route evidence

### v026 — post-Dawn bee #7 preclear

- optional bee #7 authored patrol: `13320..14140`
- following pit begins at `14210`
- bee cleared on safe ground before pit commitment
- attacks: `6`
- cleared at approximately `x=13935`
- pit #4 primary near `x=14097`
- pit #4 double near `x=14216`
- pit #4 cleared near `x=14418`
- damage: `0`

### v027 — optional slime #8 preclear

- optional slime #8 authored spawn/patrol: `16540`, patrol `16240..16860`
- next pit begins at `17180`
- slime cleared before pit commitment
- attacks: `4`
- cleared at approximately `x=16230`
- pit #5 primary near `x=17068`
- pit #5 double near `x=17186`
- pit #5 cleared near `x=17371`
- damage: `0`

### Gate B

The existing combat logic defeated the authored Arena-B enemies naturally. At seal collection the QA snapshot recorded:

- `GATE_B.open = true`
- `GATE_B.defeated = 3`
- `GATE_B.required = 2`
- player hearts remained `3`

### v024 + v025 — SEAL_SPIRIT

- optional Arena-B slime #12 cleared by ordinary player attacks: `4` attack pulses in this run
- v025 run-up ready near `x=21615`
- primary near `x=21656`
- normal air/double jump near `x=21768`
- physical landing on authored `21880` ledge near `x=21874 / y=132`
- existing v018 stage-1 route then performed primary + double
- `SEAL_SPIRIT` physically collected near `x=22090`

## Integrity

v026/v027/v024/v025 are input-only autoplay overlays. They do not change physics, collision, hitboxes, player HP, enemy HP, damage rules, gates, collectibles, saves, timers, platform geometry, acceptance thresholds or PASS rules.

## Next gate

Promote v026 + v027 into the natural terminal RC39 diagnostic and run the campaign from the real beginning. Only after a natural terminal/full-campaign result should the original integrated campaign runner be used for acceptance.
