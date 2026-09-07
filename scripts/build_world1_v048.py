#!/usr/bin/env python3
"""Build the first-world v048 candidate from a verified v047 menu baseline."""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import shutil
import sys

from build_menu_v047 import BuildError, digest, inventory, is_link, relative_path, tree_digest, verify_payload, write_report

BUILD_ID = "kelvor-world1-v048"
REPORT_NAME = "WORLD1_BUILD_REPORT.json"
BASELINE_REPORT = "MENU_BUILD_REPORT.json"
BASELINE_ID = "kelvor-menu-v047"
# Audio is intentionally loaded before the scene which consumes it.
PATCHES = (
    "119-world1-input-v048.js",
    "120-world1-content-v048.js",
    "121-world1-physics-v048.js",
    "123-world1-audio-v048.js",
    "122-world1-scene-v048.js",
)
ANCHOR = "./src/runtime/v82/118-menu-experience-v047.js"


def render_index(original: bytes) -> tuple[bytes, str]:
    html = original.decode("utf-8")
    bases = re.findall(r'<base\s+[^>]*href=["\']([^"\']+)["\'][^>]*>', html, re.I)
    if len(bases) != 1 or not bases[0].startswith("./") or not bases[0].endswith("/"):
        raise BuildError("index.html deve conter exatamente um base href local ./release.../.")
    release = relative_path(bases[0][2:-1])
    pattern = re.compile(r'<script\s+src=["\']' + re.escape(ANCHOR) + r'["\']\s*>\s*</script>', re.I)
    if len(pattern.findall(html)) != 1 or any(patch in html for patch in PATCHES):
        raise BuildError("A base deve incluir o patch 118 exatamente uma vez e ainda não incluir os patches v048.")
    newline = "\r\n" if "\r\n" in html else "\n"
    includes = newline.join(f'<script src="./src/runtime/v82/{patch}"></script>' for patch in PATCHES)
    html = pattern.sub(lambda match: match.group(0) + newline + includes, html, count=1)
    title = "<title>KELVOR — O primeiro mundo floresce (v048)</title>"
    if len(re.findall(r"<title\b[^>]*>.*?</title>", html, re.I | re.S)) != 1:
        raise BuildError("index.html deve conter exatamente um título.")
    html = re.sub(r"<title\b[^>]*>.*?</title>", lambda _: title, html, count=1, flags=re.I | re.S)
    description = '<meta name="description" content="O primeiro mundo de KELVOR floresce: caminhos vivos, descobertas e novas aventuras.">'
    descriptions = re.compile(r'<meta\b(?=[^>]*\bname\s*=\s*["\']description["\'])[^>]*>', re.I)
    if len(descriptions.findall(html)) > 1:
        raise BuildError("index.html contém descrições duplicadas.")
    if descriptions.search(html):
        html = descriptions.sub(lambda _: description, html, count=1)
    else:
        html = html.replace(title, title + newline + description, 1)
    return html.encode("utf-8"), release


def build(args: argparse.Namespace) -> dict:
    for path in (args.baseline, args.output, args.repo):
        if is_link(path.expanduser()):
            raise BuildError(f"Pasta vinculada não permitida: {path}")
    baseline, output, repo = (path.expanduser().resolve() for path in (args.baseline, args.output, args.repo))
    if not baseline.is_dir() or not (baseline / "index.html").is_file() or not (baseline / BASELINE_REPORT).is_file():
        raise BuildError(f"CANDIDATO_V047 com manifesto não encontrado: {baseline}")
    if output == baseline or output.is_relative_to(baseline) or baseline.is_relative_to(output):
        raise BuildError("Base e candidato devem ser pastas separadas, sem relação de ancestralidade.")
    if output == repo or repo.is_relative_to(output) or output.is_relative_to(repo):
        raise BuildError("O candidato deve ficar fora do repositório de edição.")
    before = inventory(baseline)
    baseline_report = json.loads((baseline / BASELINE_REPORT).read_text(encoding="utf-8-sig"))
    payload = {key: record for key, record in before.items() if key != BASELINE_REPORT}
    verify_payload(baseline_report, payload, BASELINE_ID)
    index_bytes, release = render_index((baseline / "index.html").read_bytes())
    if not (baseline / release).is_dir():
        raise BuildError(f"Diretório de runtime não encontrado: {release}")
    sources = {}
    for name in PATCHES:
        patch = repo / "patches" / name
        if not patch.is_file() or is_link(patch) or is_link(patch.parent) or not patch.resolve().is_relative_to(repo):
            raise BuildError(f"Patch v048 ainda não disponível ou origem vinculada: {patch}")
        sources[f"{release}/src/runtime/v82/{name}"] = patch
    assets_root = repo / "assets" / "world1-v048"
    if not assets_root.is_dir():
        raise BuildError(f"Pasta de arte ainda não disponível: {assets_root}")
    assets = inventory(assets_root)
    if not assets:
        raise BuildError("A pasta assets/world1-v048 deve conter os arquivos do primeiro mundo.")
    sources.update({f"{release}/assets/world1-v048/{key}": assets_root / key for key in assets})
    source_records = {key: {"path": str(path), "bytes": path.stat().st_size, "sha256": digest(path)} for key, path in sources.items()}
    declared = {"index.html", *sources}
    prior_owned: set[str] = set()
    report_path = output / REPORT_NAME
    if output.exists():
        if not output.is_dir() or not report_path.is_file():
            raise BuildError(f"Destino existente sem manifesto deste build: {output}. Escolha uma pasta nova.")
        prior = json.loads(report_path.read_text(encoding="utf-8-sig"))
        if (prior.get("build_id") != BUILD_ID or prior.get("baseline", {}).get("tree_sha256") != tree_digest(before)
                or Path(prior.get("output", "")).resolve() != output):
            raise BuildError("Destino não pertence a este build e à mesma base. Nada foi atualizado.")
        prior_owned = {relative_path(value) for value in prior.get("declared_files", []) + prior.get("retained_previous_outputs", [])}
        current = inventory(output, exclude=REPORT_NAME)
        previous = prior.get("candidate_files")
        if not isinstance(previous, dict):
            raise BuildError("Manifesto anterior não possui inventário válido.")
        for key in previous:
            relative_path(key)
        changed = sorted(key for key in set(previous) - prior_owned if current.get(key) != previous[key])
        changed.extend(sorted(key for key in prior_owned - declared if current.get(key) != previous.get(key)))
        extra = sorted(set(current) - set(previous))
        if changed or extra:
            raise BuildError(f"Arquivos alheios aos outputs deste build mudaram. Alterados={changed[:6]}; extras={extra[:6]}")
        for key in declared:
            if key in current and key not in prior_owned and key not in before:
                raise BuildError(f"Arquivo alheio ocuparia um destino declarado: {key}")
    else:
        output.parent.mkdir(parents=True, exist_ok=True)
        shutil.copytree(baseline, output)

    # Reruns write only declared outputs. Earlier assets are retained, never deleted.
    (output / "index.html").write_bytes(index_bytes)
    for relative, source in sources.items():
        destination = output / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)
    if inventory(baseline) != before:
        raise BuildError("A base mudou durante o build. Candidato não validado; confira a origem da alteração.")
    candidate = inventory(output, exclude=REPORT_NAME)
    for key, record in source_records.items():
        if digest(Path(record["path"])) != record["sha256"] or candidate[key]["sha256"] != record["sha256"]:
            raise BuildError(f"A fonte mudou durante o build ou a cópia diverge: {key}")
    if candidate["index.html"]["sha256"] != hashlib.sha256(index_bytes).hexdigest():
        raise BuildError("index.html diverge do conteúdo gerado.")
    allowed = declared | prior_owned
    missing = sorted(set(before) - set(candidate))
    unexpected = sorted(key for key in set(before) - allowed if candidate.get(key) != before[key])
    if missing or unexpected:
        raise BuildError(f"O candidato não preservou a base. Ausentes={missing[:6]}; alterações={unexpected[:6]}")
    changes = [{"path": key, "type": "added" if key not in before else "changed", "declared": key in declared,
                "base_sha256": before.get(key, {}).get("sha256"), "candidate_sha256": candidate[key]["sha256"]}
               for key in sorted(candidate) if candidate[key] != before.get(key)]
    report = {
        "build_id": BUILD_ID, "generated_utc": datetime.now(timezone.utc).isoformat(), "status": "BUILD_VERIFIED_QA_PENDING",
        "output": str(output), "repo": str(repo), "release_dir": release, "patch_order": list(PATCHES),
        "baseline": {"path": str(baseline), "tree_sha256": tree_digest(before), "files": len(before), "unchanged_after_build": True,
                     "known_manifest": {"path": str(baseline / BASELINE_REPORT), "sha256": before[BASELINE_REPORT]["sha256"],
                                        "status": "verified", "payload_files": len(payload), "payload_tree_sha256": tree_digest(payload)}},
        "candidate": {"tree_sha256": tree_digest(candidate), "files": len(candidate), "report_excluded_from_hash": REPORT_NAME},
        "declared_files": sorted(declared), "retained_previous_outputs": sorted(prior_owned - declared),
        "sources": source_records, "changes": changes, "base_files": before, "candidate_files": candidate,
        "qa_note": "Build e hashes verificados. Gameplay, arte, áudio, colisões, diversão e aparelhos reais exigem QA separado.",
    }
    write_report(report_path, report)
    return report


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--baseline", required=True, type=Path, help="CANDIDATO_V047 com MENU_BUILD_REPORT.json válido.")
    parser.add_argument("--output", required=True, type=Path, help="Pasta nova CANDIDATO_V048 ou destino reconhecido de execução anterior.")
    parser.add_argument("--repo", type=Path, default=Path(__file__).resolve().parents[1], help="Repositório com patches/ e assets/world1-v048/.")
    try:
        report = build(parser.parse_args(argv))
    except (BuildError, OSError, UnicodeError, ValueError, KeyError, TypeError) as error:
        print(f"ERRO: {error}", file=sys.stderr)
        return 1
    print(f"Candidato v048 construído: {report['output']}")
    print(f"Base preservada e manifesto v047 verificado: {report['baseline']['files']} arquivos.")
    print(f"Candidato: {report['candidate']['files']} arquivos; árvore {report['candidate']['tree_sha256']}")
    print(f"Relatório: {Path(report['output']) / REPORT_NAME}")
    print("Status: BUILD_VERIFIED_QA_PENDING")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
