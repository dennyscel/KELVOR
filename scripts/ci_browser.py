#!/usr/bin/env python3
"""Launcher used by Python's webbrowser module on GitHub Actions Windows.

It does not alter the KELVOR server, URLs, acceptance rules, timers or evidence.
It only starts Chrome headless for the URL that the existing runner requested.
"""
from __future__ import annotations
import os, shutil, subprocess, sys, tempfile
from pathlib import Path


def find_chrome() -> str:
    candidates = [
        os.environ.get("CHROME_PATH"),
        shutil.which("chrome"), shutil.which("chrome.exe"),
        shutil.which("google-chrome"), shutil.which("google-chrome-stable"),
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    ]
    for value in candidates:
        if value and Path(value).exists():
            return str(Path(value))
    raise SystemExit("Google Chrome nao encontrado no runner.")


def main() -> int:
    if len(sys.argv) != 2:
        print("Uso: ci_browser.py <url>", file=sys.stderr)
        return 2
    url = sys.argv[1]
    if not (url.startswith("http://127.0.0.1:") or url.startswith("http://localhost:")):
        print("URL recusada: somente localhost/127.0.0.1 e permitido.", file=sys.stderr)
        return 2
    chrome = find_chrome()
    profile = tempfile.mkdtemp(prefix="kelvor-chrome-")
    cmd = [
        chrome,
        "--headless=new",
        "--disable-gpu",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-background-networking",
        "--disable-component-update",
        "--disable-features=Translate,MediaRouter",
        "--autoplay-policy=no-user-gesture-required",
        f"--user-data-dir={profile}",
        "--window-size=1440,900",
        url,
    ]
    creationflags = getattr(subprocess, "CREATE_NO_WINDOW", 0)
    subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                     creationflags=creationflags)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
