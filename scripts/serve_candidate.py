#!/usr/bin/env python3
"""Serve one verified local candidate. Never reuse or stop another server."""

from __future__ import annotations

import argparse
from functools import partial
import hashlib
import http.server
import json
from pathlib import Path
import socket
import sys
import threading
import webbrowser


REPORT_NAME = "LIVING_MAP_BUILD_REPORT.json"


class LocalServer(http.server.ThreadingHTTPServer):
    allow_reuse_address = False
    daemon_threads = True

    def server_bind(self):
        # Windows otherwise allows two listeners to contend for one address.
        if hasattr(socket, "SO_EXCLUSIVEADDRUSE"):
            self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
        super().server_bind()


class CandidateHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        if self.path.split("?", 1)[0] == "/__kelvor_health":
            body = json.dumps({"build": "kelvor-living-map-v046", "local_only": True}).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()


def main(argv: list[str] | None = None) -> int:
    repo = Path(__file__).resolve().parents[1]
    default_root = repo.parent.parent / "03_JOGO_LOCAL" / "CANDIDATO_V046"
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=default_root, help="Pasta do candidato com index.html e relatório do build.")
    parser.add_argument("--port", type=int, default=8766, help="Porta local; padrão 8766.")
    parser.add_argument("--no-browser", action="store_true", help="Não abrir o navegador automaticamente.")
    args = parser.parse_args(argv)
    root = args.root.expanduser().resolve()
    if not 1 <= args.port <= 65535:
        parser.error("A porta deve estar entre 1 e 65535.")
    try:
        if not (root / "index.html").is_file() or not (root / REPORT_NAME).is_file():
            raise ValueError(f"Candidato não construído: {root}. Execute scripts/build_living_map.py primeiro.")
        report = json.loads((root / REPORT_NAME).read_text(encoding="utf-8"))
        if report.get("build_id") != "kelvor-living-map-v046" or report.get("status") != "BUILD_VERIFIED_QA_PENDING":
            raise ValueError("Relatório do candidato ausente ou incompatível; execute o builder.")
        files = report.get("candidate_files")
        if not isinstance(files, dict) or "index.html" not in files:
            raise ValueError("Relatório sem inventário de arquivos; execute o builder.")
        for relative, record in files.items():
            path = (root / relative).resolve()
            if not path.is_relative_to(root) or not path.is_file():
                raise ValueError(f"Arquivo do candidato ausente ou inválido: {relative}. Execute o builder.")
            sha = hashlib.sha256()
            with path.open("rb") as stream:
                for block in iter(lambda: stream.read(1024 * 1024), b""):
                    sha.update(block)
            if sha.hexdigest() != record.get("sha256"):
                raise ValueError(f"Arquivo do candidato alterado após o build: {relative}. Execute o builder.")
        server = LocalServer(("127.0.0.1", args.port), partial(CandidateHandler, directory=str(root)))
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(f"ERRO: {error}", file=sys.stderr)
        print("Se a porta estiver ocupada, este launcher não reutiliza nem encerra o servidor existente. Use --port com outra porta.", file=sys.stderr)
        return 1
    url = f"http://127.0.0.1:{args.port}/"
    print(f"KELVOR v046: {url}", flush=True)
    print(f"Pasta: {root}", flush=True)
    print("Mantenha esta janela aberta. Ctrl+C encerra somente este servidor local.", flush=True)
    if not args.no_browser:
        def open_browser():
            try:
                if not webbrowser.open(url, new=2):
                    print(f"Navegador não abriu automaticamente. Abra {url}", flush=True)
            except Exception as error:
                print(f"Não foi possível abrir navegador: {error}. Abra {url}", flush=True)
        threading.Thread(target=open_browser, daemon=True).start()
    try:
        server.serve_forever(poll_interval=0.2)
    except KeyboardInterrupt:
        print("\nServidor deste launcher encerrado.")
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
