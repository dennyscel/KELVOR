# KELVOR — Mobile / Cloud Continuity

Status: ACTIVE DEVELOPMENT — NOT LOCKED
Date: 2026-09-05

## Objective

Keep KELVOR development, QA and evidence collection moving even when the owner only has a phone and the ChatGPT sandbox cannot browse its own localhost.

## Canonical cloud path

1. **Source / automation:** private GitHub repository `dennyscel/KELVOR`.
2. **Large immutable candidates:** private GitHub Releases, always pinned by exact SHA-256.
3. **Secondary binary mirror:** canonical KELVOR Google Drive folders, also SHA-256 verified.
4. **Windows browser execution:** GitHub Actions `windows-latest` with installed Google Chrome.
5. **Local HTTP inside QA machine:** `127.0.0.1` is created inside the GitHub Windows runner; the ChatGPT sandbox does not need to reach it.
6. **Evidence:** GitHub Actions artifacts (JSON, traces, screenshots/logs where relevant), then mirror canonical evidence to Drive when promoted.
7. **Repository integrity:** checksum-sync workflow records repository changes independently.

## Fallback matrix

| Blocker | Primary path | Fallback |
|---|---|---|
| ChatGPT Chrome blocks localhost | GitHub Windows runner + Chrome + 127.0.0.1 | Keep the browser test entirely inside Actions and retrieve only artifacts |
| Owner has no Windows PC | Trigger QA through repository commits/workflow dispatch | Run diagnostics and campaign tests on GitHub-hosted Windows |
| Binary is too large for normal Git file | Private GitHub Release | Google Drive canonical mirror |
| Connector cannot create a new workflow | Reuse/update an already-authorized KELVOR workflow | Add a diagnostic step/job to the existing Windows workflow |
| Need code hidden inside a large Release ZIP | CI source-probe extracts only matching source files | Targeted runtime geometry/introspection through Selenium |
| Need to tune a difficult gameplay route | Physics sweep in Chrome using real PlayerController/input router | Targeted diagnostic with high-frequency telemetry |
| Need evidence from a failing run | `actions/upload-artifact` with `if: always()` | Workflow/job logs plus compact JSON evidence |
| Need final web deployment | Hostinger release package after all gates | GitHub-hosted staging/public preview only after explicit exposure decision |

## QA integrity rules

- Diagnostic teleports may be used **only to accelerate isolated investigation** and must be marked `diagnostic_only` / `counts_as_campaign_pass: false`.
- A campaign PASS must come from the normal game rules and acceptance gates, not from a diagnostic reset/teleport.
- Never change physics, hitboxes, lives, save data or acceptance thresholds merely to make CI pass.
- Every promoted candidate must preserve or intentionally document file deltas and carry SHA-256 evidence.
- Targeted diagnostics do not replace the full campaign Gauntlet, mobile/human QA, or release gates.

## Current cloud capabilities already proven

- Private Release download from Actions.
- Exact outer SHA-256 verification before extraction.
- Windows Server runner.
- Google Chrome / ChromeDriver.
- Python + Selenium.
- HTTP on `127.0.0.1` inside the runner.
- Headless in-engine campaign execution.
- Source probing of files stored only inside the Release ZIP.
- Runtime geometry capture from Phaser.
- High-frequency player telemetry.
- Action artifacts downloadable back into the project analysis environment.

## Deployment boundary

The final Hostinger upload remains gated. When the release is genuinely ready, deployment can be automated from GitHub Actions through a Hostinger-supported authenticated channel (for example SFTP/SSH/FTP depending on the hosting account), with credentials stored as GitHub Actions secrets. Credentials must never be committed to the repository or evidence artifacts.

This document establishes the cloud route as the default continuity path whenever a local-PC-only step would otherwise stop the project.
