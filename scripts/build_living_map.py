#!/usr/bin/env python3
"""Build the isolated v046 candidate without changing its v045 baseline."""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import shutil
import sys


BUILD_ID = "kelvor-living-map-v046"
REPORT_NAME = "LIVING_MAP_BUILD_REPORT.json"
PATCHES = ("116-world-map-model-v046.js", "117-world-map-scene-v046.js")
ANCHOR = "./src/runtime/v82/115-secondary-cleanup-v045.js"


class BuildError(Exception):
    pass


def digest(path: Path) -> str:
    sha = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            sha.update(block)
    return sha.hexdigest()


def inventory(root: Path, exclude_report: bool = False) -> dict[str, dict]:
    result = {}
    for path in sorted(root.rglob("*")):
        if path.is_symlink():
            raise BuildError(f"Link simbólico não permitido no build: {path}")
        if path.is_file():
            relative = path.relative_to(root).as_posix()
            if exclude_report and relative == REPORT_NAME:
                continue
            result[relative] = {"bytes": path.stat().st_size, "sha256": digest(path)}
    return result


def tree_digest(files: dict[str, dict]) -> str:
    canonical = "".join(f"{key}\t{files[key]['sha256']}\n" for key in sorted(files))
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def relative_path(value: str) -> str:
    path = PurePosixPath(value)
    if not value or path.is_absolute() or ".." in path.parts or "\\" in value or ":" in value:
        raise BuildError(f"Caminho relativo inválido: {value!r}")
    return path.as_posix()


def verify_known_manifest(path: Path | None, files: dict[str, dict]) -> dict:
    if path is None:
        return {"status": "not_provided", "note": "Integridade comparada nesta execução; sem manifesto histórico."}
    if not path.is_file():
        raise BuildError(f"Manifesto da base não encontrado: {path}")
    content = json.loads(path.read_text(encoding="utf-8-sig"))
    records = content.get("files")
    if not isinstance(records, list) or not records:
        raise BuildError(f"Manifesto sem lista de arquivos: {path}")
    expected = {}
    for record in records:
        relative = relative_path(record["path"])
        if relative in expected:
            raise BuildError(f"Caminho duplicado no manifesto: {relative}")
        expected[relative] = record
    missing = sorted(set(expected) - set(files))
    extra = sorted(set(files) - set(expected))
    changed = sorted(key for key in set(files) & set(expected)
                     if files[key]["sha256"].lower() != expected[key]["sha256"].lower()
                     or ("bytes" in expected[key] and files[key]["bytes"] != expected[key]["bytes"]))
    if missing or extra or changed:
        raise BuildError("A base diverge do manifesto original. Build cancelado. "
                         f"Ausentes={missing[:6]}; extras={extra[:6]}; alterados={changed[:6]}")
    return {"status": "verified", "path": str(path), "sha256": digest(path), "files": len(files)}


def render_index(original: bytes) -> tuple[bytes, str]:
    html = original.decode("utf-8")
    bases = re.findall(r'<base\s+[^>]*href=["\']([^"\']+)["\'][^>]*>', html, re.I)
    if len(bases) != 1 or not bases[0].startswith("./") or not bases[0].endswith("/"):
        raise BuildError("index.html deve ter exatamente um base href local no formato ./release.../.")
    release = relative_path(bases[0][2:].rstrip("/"))
    pattern = re.compile(r'<script\s+src=["\']' + re.escape(ANCHOR) + r'["\']\s*>\s*</script>', re.I)
    if len(pattern.findall(html)) != 1:
        raise BuildError("index.html não possui exatamente uma inclusão do patch 115 v045.")
    if any(name in html for name in PATCHES):
        raise BuildError("A base já inclui v046; forneça BASE_V045 original.")
    newline = "\r\n" if "\r\n" in html else "\n"
    addition = "".join(newline + f'<script src="./src/runtime/v82/{name}"></script>' for name in PATCHES)
    rendered = pattern.sub(lambda match: match.group(0) + addition, html, count=1)
    return rendered.encode("utf-8"), release


def write_report(path: Path, report: dict) -> None:
    temporary = path.with_name(path.name + ".tmp")
    with temporary.open("x", encoding="utf-8", newline="\n") as stream:
        json.dump(report, stream, ensure_ascii=False, indent=2)
        stream.write("\n")
    temporary.replace(path)


def build(args: argparse.Namespace) -> dict:
    baseline = args.baseline.expanduser().resolve()
    output = args.output.expanduser().resolve()
    repo = args.repo.expanduser().resolve()
    if not baseline.is_dir() or not (baseline / "index.html").is_file():
        raise BuildError(f"Base v045 válida não encontrada: {baseline}")
    if output == baseline or output.is_relative_to(baseline) or baseline.is_relative_to(output):
        raise BuildError("Base e candidato devem ser pastas separadas, sem relação de ancestralidade.")
    if output == repo or repo.is_relative_to(output) or output.is_relative_to(repo):
        raise BuildError("Use uma pasta de candidato separada do repositório de edição.")
    before = inventory(baseline)
    known = args.baseline_manifest
    if known is None:
        for ancestor in (baseline.parent, baseline.parent.parent, repo.parent, repo.parent.parent):
            guess = ancestor / "04_VALIDACAO" / "base_local_manifest.json"
            if guess.is_file():
                known = guess
                break
    known_check = verify_known_manifest(known.resolve() if known else None, before)
    index_bytes, release = render_index((baseline / "index.html").read_bytes())
    if not (baseline / release).is_dir():
        raise BuildError(f"Diretório do base href não encontrado: {release}")

    sources: dict[str, Path] = {}
    for name in PATCHES:
        source = repo / "patches" / name
        if not source.is_file() or source.is_symlink():
            raise BuildError(f"Patch necessário ainda não disponível: {source}")
        sources[f"{release}/src/runtime/v82/{name}"] = source
    assets_root = repo / "assets" / "world-map"
    if not assets_root.is_dir() or assets_root.is_symlink():
        raise BuildError(f"Arte do mapa ainda não disponível: {assets_root}")
    assets = inventory(assets_root)
    if not assets:
        raise BuildError(f"Pasta de arte vazia: {assets_root}")
    for relative in assets:
        sources[f"{release}/assets/world-map/{relative}"] = assets_root / relative
    source_records = {key: {"path": str(path), "bytes": path.stat().st_size, "sha256": digest(path)}
                      for key, path in sources.items()}
    declared = {"index.html", *sources}
    prior: dict = {}
    report_path = output / REPORT_NAME
    if output.exists():
        if not output.is_dir() or output.is_symlink() or not report_path.is_file():
            raise BuildError(f"Destino já existe sem manifesto deste build. Escolha uma pasta nova: {output}")
        prior = json.loads(report_path.read_text(encoding="utf-8"))
        if (prior.get("build_id") != BUILD_ID or prior.get("baseline", {}).get("tree_sha256") != tree_digest(before)
                or Path(prior.get("output", "")).resolve() != output):
            raise BuildError("Destino não pertence a este build/base. Nenhum arquivo foi atualizado.")
        current = inventory(output, exclude_report=True)
        prior_declared = {relative_path(value) for value in prior.get("declared_files", [])}
        protected = set(before) - declared - prior_declared
        changed = sorted(key for key in protected if current.get(key) != before[key])
        if changed:
            raise BuildError(f"Arquivos preservados do candidato foram alterados/retirados: {changed[:6]}")
        for key in declared:
            if key in current and key not in prior_declared and key not in before:
                raise BuildError(f"Arquivo alheio ao build ocuparia o destino declarado: {key}")
    else:
        output.parent.mkdir(parents=True, exist_ok=True)
        shutil.copytree(baseline, output)

    # Only these named build outputs are updated on reruns. Nothing is deleted.
    (output / "index.html").write_bytes(index_bytes)
    for relative, source in sources.items():
        destination = output / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)
    after = inventory(baseline)
    if before != after:
        raise BuildError("A base mudou durante o build. Candidato não validado; verifique a origem da alteração.")
    candidate = inventory(output, exclude_report=True)
    for key, record in source_records.items():
        if digest(Path(record["path"])) != record["sha256"] or candidate[key]["sha256"] != record["sha256"]:
            raise BuildError(f"Fonte mudou durante o build ou a cópia diverge: {key}")
    if candidate["index.html"]["sha256"] != hashlib.sha256(index_bytes).hexdigest():
        raise BuildError("index.html do candidato diverge do conteúdo gerado.")
    changes = []
    for relative in sorted(set(before) | set(candidate)):
        base_hash = before.get(relative, {}).get("sha256")
        candidate_hash = candidate.get(relative, {}).get("sha256")
        if base_hash != candidate_hash:
            changes.append({"path": relative, "type": "added" if base_hash is None else "changed" if candidate_hash else "missing",
                            "declared": relative in declared, "base_sha256": base_hash,
                            "source_sha256": source_records.get(relative, {}).get("sha256"), "candidate_sha256": candidate_hash})
    missing = sorted(set(before) - set(candidate))
    unexpected_changes = [entry["path"] for entry in changes if entry["base_sha256"] and not entry["declared"]]
    if missing or unexpected_changes:
        raise BuildError(f"Candidato não preservou a base. Ausentes={missing[:6]}, alterações={unexpected_changes[:6]}")
    report = {
        "build_id": BUILD_ID, "generated_utc": datetime.now(timezone.utc).isoformat(), "status": "BUILD_VERIFIED_QA_PENDING",
        "output": str(output), "repo": str(repo), "release_dir": release,
        "baseline": {"path": str(baseline), "tree_sha256": tree_digest(before), "files": len(before), "unchanged_after_build": True,
                     "known_manifest": known_check},
        "candidate": {"tree_sha256": tree_digest(candidate), "files": len(candidate), "report_excluded_from_hash": REPORT_NAME},
        "declared_files": sorted(declared),
        "retained_previous_outputs": sorted(set(prior.get("declared_files", [])) - declared),
        "sources": source_records, "changes": changes,
        "base_files": before, "candidate_files": candidate,
        "qa_note": "Build e hashes verificados. Não constitui aprovação visual, gameplay ou aparelho real.",
    }
    write_report(report_path, report)
    return report


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--baseline", required=True, type=Path, help="Pasta BASE_V045 original.")
    parser.add_argument("--output", required=True, type=Path, help="Pasta nova CANDIDATO_V046, ou destino anterior deste build.")
    parser.add_argument("--repo", type=Path, default=Path(__file__).resolve().parents[1], help="Repositório contendo patches/ e assets/world-map/.")
    parser.add_argument("--baseline-manifest", type=Path, help="Manifesto original; detecta 04_VALIDACAO/base_local_manifest.json quando presente.")
    args = parser.parse_args(argv)
    try:
        report = build(args)
    except (BuildError, OSError, UnicodeError, ValueError, KeyError, TypeError) as error:
        print(f"ERRO: {error}", file=sys.stderr)
        return 1
    print(f"Candidato v046 construído: {report['output']}")
    print(f"Base preservada: {report['baseline']['files']} arquivos. Candidato: {report['candidate']['files']} arquivos.")
    print(f"Manifesto original: {report['baseline']['known_manifest']['status']}")
    print(f"Relatório: {Path(report['output']) / REPORT_NAME}")
    print("Status: BUILD_VERIFIED_QA_PENDING")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
