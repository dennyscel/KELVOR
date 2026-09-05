# KELVOR RC39 v023 — SEAL_DAWN Targeted Evidence

Date: 2026-09-05

Status: **TARGETED DIAGNOSTIC PASS ONLY**. This is not campaign PASS, Owner QA, physical mobile QA, Hostinger production validation, or LOCKED.

## Immutable input candidate

- Base private Release asset: `KELVOR_RC39_CAMPAIGN_PRESENTATION_INTEGRATION_CANDIDATE_v004_20260905.zip`
- Base SHA-256: `77e50fde0ac6fc392237616d2842814a92a6d6d392a54487b38321c339b2d36e`
- v023 changes virtual autoplay inputs only. No gameplay physics, collision, hitbox, lives, save data, collectible rules, assets, timing gates, or PASS criteria were changed.

## Physics sweep evidence

Windows + Chrome sweep on the real PlayerController tested 48 stage-2 input tuples:

- 13 `LANDED_13040`
- 30 `GROUND_MISS`
- 5 `GROUND_SHORT`

Canonical measured tuple:

- primary launch threshold: `x=12725`
- primary hold: `380 ms`
- delayed double threshold: `x=12840` while descending
- double hold: `240 ms`
- measured tuner landing: `x=13006.11`, `y=70.32`

Runtime/source facts used by the tuner: body `34x64`, run speed `235`, air acceleration `950`, jump velocity `-585`, double jump velocity `-535`, gravity `1750`, jump-cut multiplier `0.5`.

## Natural targeted result

GitHub Actions run: `33975467950` (`KELVOR RC39 v004 Targeted SEAL_DAWN Diagnostic`, run #14).

Artifact: `KELVOR-RC39-SEAL-DAWN-TARGETED-14`, artifact id `9972192884`, digest `sha256:a0348ace27fdbe47ecacee6236d9b0053dc291cad370c08cf572c71b35936745`.

Result from `SUMMARY.json`:

- result: `SEAL1_COLLECTED`
- elapsed after diagnostic start: `25.94 s`
- seals: `1`
- hearts: `3`
- damage: `0`
- deaths: `0`

Measured trace:

1. stage-2 authored ledge reached;
2. v023 primary at `x≈12726`;
3. v023 double at `x≈12841`;
4. physical landing on the `13040` platform;
5. superseded v021/v022 wrappers retired;
6. v020 pickup logic resumes;
7. `SEAL_DAWN` is collected near `x=13280`.

The targeted harness teleports the diagnostic test instance to `x=11950` only to shorten setup. Therefore this evidence proves the repaired seal route but **does not count as campaign PASS**.

## Promotion gate

v023 is promoted only to the full RC39 terminal diagnostic. The next required evidence must come from the non-teleported campaign flow before any candidate/package promotion.
