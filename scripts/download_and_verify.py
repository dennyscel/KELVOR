#!/usr/bin/env python3
from __future__ import annotations
import argparse, hashlib, urllib.request
from pathlib import Path


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda: f.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", required=True)
    ap.add_argument("--sha256", required=True)
    ap.add_argument("--output", required=True)
    a = ap.parse_args()
    if not a.url.lower().startswith("https://"):
        raise SystemExit("Somente URL HTTPS e aceita.")
    expected = a.sha256.strip().lower()
    if len(expected) != 64 or any(c not in "0123456789abcdef" for c in expected):
        raise SystemExit("SHA-256 esperado invalido.")
    out = Path(a.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(a.url, headers={"User-Agent":"KELVOR-GitHub-Actions-QA"})
    with urllib.request.urlopen(req, timeout=120) as r, out.open("wb") as f:
        while True:
            block = r.read(1024 * 1024)
            if not block:
                break
            f.write(block)
    got = sha256(out)
    print(f"downloaded={out} bytes={out.stat().st_size} sha256={got}")
    if got != expected:
        out.unlink(missing_ok=True)
        raise SystemExit(f"SHA-256 MISMATCH: expected={expected} got={got}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
