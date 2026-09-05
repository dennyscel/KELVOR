# KELVOR — GitHub CI Windows localhost infrastructure PASS

Date: 2026-09-05

## Purpose

Prove that the GitHub-hosted Windows runner can execute Python + Google Chrome headless against `127.0.0.1`, removing the managed-localhost limitation of the previous environment without changing any KELVOR game acceptance criterion.

## Run history

### Run 1 — diagnostic failure
- Run ID: `33946141711`
- Result: `failure`
- Infrastructure facts already proven before failure:
  - Windows Server runner provisioned;
  - Google Chrome found;
  - Python syntax preflight passed;
  - Chrome reached the localhost HTTP server.
- Failure cause: the self-test handler wrote one evidence marker for every GET; Chrome requested `/favicon.ico` after the intended page, overwriting `/kelvor-ci-selftest`. The self-test therefore rejected its own overwritten marker. This was a test-harness defect, not a game or localhost failure.

### Run 2 — corrected self-test
- Commit: `521afeb0bebc791b89d096bb81d4391dfeb3d152`
- Run ID: `33946247429`
- Job ID: `101252751742`
- Result: **SUCCESS**
- All steps: success, including `Prove headless Chrome can reach 127.0.0.1`.
- Evidence artifact ID: `9963414636`
- Artifact: `KELVOR-CI-BOOTSTRAP-SELFTEST-2`
- Artifact digest: `sha256:7e2d7350a1dcb28fc8ce2ab1414e87410b5024f430619e2344eb572e6a9b97fb`

The evidence records:

```json
{
  "path": "/kelvor-ci-selftest",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.0.0 Safari/537.36",
  "status": "LOCALHOST_CHROME_REACHED"
}
```

## Decision

`GITHUB_WINDOWS_LOCALHOST_INFRASTRUCTURE = PASS`

This is **only an infrastructure gate**. It is not an 84-state game PASS, campaign PASS, Owner QA, mobile physical QA, release approval or LOCK.
