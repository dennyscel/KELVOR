# RC39 v023 — SEAL_DAWN Targeted Evidence

Date: 2026-09-05
Status: **TARGETED PASS — NOT CAMPAIGN PASS**

## Purpose

Prove the first RC37 campaign seal (`SEAL_DAWN`) can be collected by normal player physics/input after replacing the unstable stage-2 autoplay route. The diagnostic may teleport the isolated test instance near the region only to reduce investigation time; that teleport is explicitly excluded from campaign acceptance.

## GitHub Actions evidence

- Repository: `dennyscel/KELVOR`
- Workflow: `KELVOR RC39 v004 Targeted SEAL_DAWN Diagnostic`
- Run: `33975467950` / run number `14`
- Head commit: `f79d66d61f22df12723e05c10fe7c38a1a402804`
- Artifact: `KELVOR-RC39-SEAL-DAWN-TARGETED-14`
- Artifact ID: `9972192884`
- Artifact digest: `sha256:a0348ace27fdbe47ecacee6236d9b0053dc291cad370c08cf572c71b35936745`

## Result

`SEAL1_COLLECTED`

Measured at the first sample where the seal count became 1:

- elapsed targeted runtime: `25.937 s`
- player x: `13256.8997`
- player y: `51.9867`
- velocity x: `121.6534`
- velocity y: `660.8333`
- hearts: `3`
- damage count: `0`
- deaths: `0`
- seals: `1`

## Validated stage-2 tuple

A separate Windows/Chrome physics sweep tested 48 launch/double-jump combinations. 13 produced real landings on the `13040` platform. The canonical tuple promoted to v023 is:

- launch X: `12725`
- double-jump X: `12840`
- double-jump hold: `240 ms`
- measured tuner landing: approximately `x=13006.11 / y=70.32`

The natural targeted run then recorded:

- `seal1_v023_measured_primary` at x≈12726
- `seal1_v023_measured_double` at x≈12841
- physical landing on the 13040 platform
- delegation to the original v020 pickup stage
- `SEAL_DAWN` collection by the game's normal rectangle intersection rule

## Wrapper-chain correction

v021/v022 are older diagnostic autoplay wrappers. They are now explicitly created as retired sentinels (`stage=999`, `retiredBy='v023'`) before v023 stage 3 so they cannot initialize after the landing and steal the pickup route. This changes only diagnostic virtual inputs/control flow, not game physics or collision.

## Integrity boundary

This evidence does **not** claim:

- full campaign PASS;
- final RC39 approval;
- release LOCK;
- human/visual QA approval.

The next required proof is the full terminal campaign diagnostic with v023, followed by whatever next blocker that run exposes.
