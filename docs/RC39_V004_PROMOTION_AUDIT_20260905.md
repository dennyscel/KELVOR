# KELVOR RC39 v004 — Promotion Audit

Date: 2026-09-05

## Candidates

- Baseline: `KELVOR_RC39_CAMPAIGN_PRESENTATION_INTEGRATION_CANDIDATE_v003_20260905.zip`
  - bytes: `50,320,222`
  - SHA-256: `de512945b761a9423e68591e94b8bfad231498403a2aa253105cdbcebf324c86`
- Successor: `KELVOR_RC39_CAMPAIGN_PRESENTATION_INTEGRATION_CANDIDATE_v004_20260905.zip`
  - bytes: `50,335,428`
  - SHA-256: `77e50fde0ac6fc392237616d2842814a92a6d6d392a54487b38321c339b2d36e`

## Byte-preservation audit

The release root changed name from `release_v79_campaign_presentation_rc39_v003_20260905` to `release_v81_campaign_presentation_rc39_v004_20260905`, so the comparison was normalized by relative path inside each release root.

Result:

- v003 release files: **614**
- those same logical paths present in v004: **614/614**
- byte-identical: **614/614**
- removed v003 release files: **0**
- modified shared v003 release files: **0**
- v004 release additions: **2**
  - `src/runtime/v80/73-global-presentation-cleanup-rc39-v004.js`
  - `src/runtime/v81/74-campaign-integrated-gauntlet-rc39-v004.js`

Outside the normalized release root, v004 adds the v004 runner/BAT and three QA evidence files. Package metadata, README, top-level SHA256SUMS and `web/index.html` are version/control-surface changes.

`web/index.html` changes only:

1. base release directory v79/v003 → v81/v004;
2. document title v003 → v004;
3. the two final runtime script tags to the two new v004 runtimes.

## Presentation correction

The new sanitizer expands player-route cleanup to cover the previously missed candidate labels, including:

- `BOSS CANDIDATO`
- normal `CANDIDATO`
- `FINAL BOSS CANDIDATO`
- `SECRET CANDIDATE`
- `GOLDEN CANDIDATE`
- `PROVISIONAL TITLE` / dependency-blocked technical labels hidden on normal player routes

Explicit QA routes preserve diagnostics.

The package's own static audit reports:

- JS syntax: `82/82`
- HTML refs: `80/80`
- static HTTP root: `632/632`
- static HTTP subpath: `632/632`
- static literal paths: `343/343`
- missing-route 404: PASS
- internal package SHA256SUMS: **981/981 verified independently in the workspace**

## Gate decision

`RC39 v004 = CURRENT CAMPAIGN CANDIDATE / STATIC PROMOTION PASS / RUNTIME + OWNER + MOBILE PENDING`

This promotion does **not** claim campaign runtime PASS, Owner visual PASS, mobile physical PASS, Hostinger production PASS or LOCK.
