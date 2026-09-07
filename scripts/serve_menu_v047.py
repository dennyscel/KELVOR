#!/usr/bin/env python3
"""Serve the verified local v047 candidate, without reusing any existing server."""

from __future__ import annotations

import argparse
from functools import partial
import http.server
import json
from pathlib import Path
import socket
import sys
import threading
import webbrowser

from build_menu_v047 import BUILD_ID, REPORT_NAME, BuildError, inventory, verify_payload


class LocalServer(http.server.ThreadingHTTPServer):
    allow_reuse_address = False
    daemon_threads = True

    def server_bind(self):
        if hasattr(socket, "SO_EXCLUSIVEADDRUSE"):
            self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
        super().server_bind()


class CandidateHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        if self.path.split("?", 1)[0] == "/__kelvor_health":
            body = json.dumps({"build": BUILD_ID, "local_only": True}).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()


def main(argv: list[str] | None = None) -> int:
    repo = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=repo.parent.parent / "03_JOGO_LOCAL" / "CANDIDATO_V047")
    parser.add_argument("--port", type=int, default=8768)
    parser.add_argument("--no-browser", action="store_true")
    args = parser.parse_args(argv)
    root = args.root.expanduser().resolve()
    if not 1 <= args.port <= 65535:
        parser.error("A porta deve estar entre 1 e 65535.")
    try:
        if not (root / "index.html").is_file() or not (root / REPORT_NAME).is_file():
            raise BuildError(f"Candidato não construído: {root}. Execute scripts/build_menu_v047.py primeiro.")
        report = json.loads((root / REPORT_NAME).read_text(encoding="utf-8-sig"))
        verify_payload(report, inventory(root, exclude=REPORT_NAME), BUILD_ID)
        server = LocalServer(("127.0.0.1", args.port), partial(CandidateHandler, directory=str(root)))
    except (BuildError, OSError, ValueError, KeyError, TypeError) as error:
        print(f"ERRO: {error}", file=sys.stderr)
        print("Uma porta ocupada não será reutilizada e nenhum servidor existente será encerrado. Use --port com outra porta.", file=sys.stderr)
        return 1
    url = f"http://127.0.0.1:{args.port}/"
    print(f"KELVOR v047: {url}", flush=True)
    print(f"Pasta: {root}", flush=True)
    print("Ctrl+C encerra somente este servidor local.", flush=True)
    if not args.no_browser:
        def open_browser():
            try:
                if not webbrowser.open(url, new=2):
                    print(f"Abra {url} no navegador.", flush=True)
            except Exception as error:
                print(f"Navegador não abriu automaticamente: {error}. Abra {url}", flush=True)
        threading.Thread(target=open_browser, daemon=True).start()
    try:
        server.serve_forever(poll_interval=0.2)
    except KeyboardInterrupt:
        print("\nServidor v047 encerrado.")
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
