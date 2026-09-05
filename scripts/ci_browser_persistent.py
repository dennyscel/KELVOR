#!/usr/bin/env python3
"""Persistent Selenium launcher for the original KELVOR campaign runner.

CI-only transport fix. It does not modify game code, timers, physics, lives,
acceptance gates, result payloads, or verdict logic. It keeps Chrome alive until
the existing JS gauntlet posts/finishes, or until a bounded safety timeout.
"""
from __future__ import annotations
import os, shutil, sys, time
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options


def find_chrome() -> str:
    candidates = [
        os.environ.get("CHROME_PATH"),
        shutil.which("chrome"), shutil.which("chrome.exe"),
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    ]
    for value in candidates:
        if value and Path(value).exists():
            return str(Path(value))
    raise SystemExit("Google Chrome nao encontrado no runner.")


def main() -> int:
    if len(sys.argv) != 2:
        print("Uso: ci_browser_persistent.py <url>", file=sys.stderr)
        return 2
    url = sys.argv[1]
    if not (url.startswith("http://127.0.0.1:") or url.startswith("http://localhost:")):
        print("URL recusada: somente localhost/127.0.0.1.", file=sys.stderr)
        return 2

    options = Options()
    options.binary_location = find_chrome()
    for flag in (
        "--headless=new", "--disable-gpu", "--no-first-run",
        "--no-default-browser-check", "--autoplay-policy=no-user-gesture-required",
        "--window-size=1440,900",
    ):
        options.add_argument(flag)

    driver = webdriver.Chrome(options=options)
    try:
        driver.set_page_load_timeout(60)
        driver.get(url)
        deadline = time.monotonic() + 350.0
        while time.monotonic() < deadline:
            time.sleep(0.5)
            try:
                state = driver.execute_script("""
                    const g=window.__KELVOR_CAMPAIGN_INTEGRATED_GAUNTLET_RC39_V004__;
                    return g ? {finished:!!g.__finished, posted:!!g.__posted, status:g.status||null} : null;
                """)
                if state and state.get("finished") and state.get("posted"):
                    print("KELVOR browser result posted:", state)
                    return 0
            except Exception:
                # The original runner remains authoritative; keep the browser alive.
                pass
        print("KELVOR persistent browser safety timeout reached; closing Chrome.")
        return 0
    finally:
        try:
            driver.quit()
        except Exception:
            pass


if __name__ == "__main__":
    raise SystemExit(main())
