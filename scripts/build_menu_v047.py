#!/usr/bin/env python3
"""Build a verified v047 menu candidate while preserving the v046 baseline."""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import shutil
import sys

BUILD_ID = "kelvor-menu-v047"
REPORT_NAME = "MENU_BUILD_REPORT.json"
BASELINE_REPORT = "LIVING_MAP_BUILD_REPORT.json"
PATCH = "118-menu-experience-v047.js"
ANCHOR = "./src/runtime/v82/117-world-map-scene-v046.js"


class BuildError(Exception):
    pass


def digest(path: Path) -> str:
    sha = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            sha.update(block)
    return sha.hexdigest()


def is_link(path: Path) -> bool:
    return path.is_symlink() or (hasattr(path, "is_junction") and path.is_junction())


def inventory(root: Path, exclude: str | None = None) -> dict[str, dict]:
    if is_link(root):
        raise BuildError(f"Pasta vinculada não permitida: {root}")
    result = {}
    for path in sorted(root.rglob("*")):
        if is_link(path):
            raise BuildError(f"Link ou junção não permitido no build: {path}")
        if path.is_file():
            relative = path.relative_to(root).as_posix()
            if relative == exclude:
                continue
            result[relative] = {"bytes": path.stat().st_size, "sha256": digest(path)}
    return result


def tree_digest(files: dict[str, dict]) -> str:
    canonical = "".join(f"{key}\t{files[key]['sha256']}\n" for key in sorted(files))
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def relative_path(value: str) -> str:
    if not isinstance(value, str):
        raise BuildError("Caminho relativo deve ser texto.")
    path = PurePosixPath(value)
    if not value or path.is_absolute() or ".." in path.parts or "\\" in value or ":" in value or path.as_posix() != value:
        raise BuildError(f"Caminho relativo inválido: {value!r}")
    return value


def verify_payload(report: dict, actual: dict[str, dict], expected_id: str) -> None:
    if report.get("build_id") != expected_id or report.get("status") != "BUILD_VERIFIED_QA_PENDING":
        raise BuildError("Manifesto ausente ou incompatível com a versão esperada.")
    expected = report.get("candidate_files")
    if not isinstance(expected, dict) or "index.html" not in expected:
        raise BuildError("Manifesto sem inventário válido do candidato.")
    for key, record in expected.items():
        relative_path(key)
        if not isinstance(record, dict) or not isinstance(record.get("bytes"), int) or not re.fullmatch(r"[0-9a-f]{64}", record.get("sha256", "")):
            raise BuildError(f"Registro de hash inválido: {key}")
    missing = sorted(set(expected) - set(actual))
    extra = sorted(set(actual) - set(expected))
    changed = sorted(key for key in set(actual) & set(expected) if actual[key] != expected[key])
    if missing or extra or changed:
        raise BuildError(f"Payload diverge do manifesto. Ausentes={missing[:6]}; extras={extra[:6]}; alterados={changed[:6]}")
    candidate = report.get("candidate", {})
    if candidate.get("tree_sha256") != tree_digest(actual) or candidate.get("files") != len(actual):
        raise BuildError("Hash da árvore ou contagem de arquivos do manifesto diverge do payload.")


def render_index(original: bytes) -> tuple[bytes, str]:
    html = original.decode("utf-8")
    bases = re.findall(r'<base\s+[^>]*href=["\']([^"\']+)["\'][^>]*>', html, re.I)
    if len(bases) != 1 or not bases[0].startswith("./") or not bases[0].endswith("/"):
        raise BuildError("index.html deve conter exatamente um base href local ./release.../.")
    release = relative_path(bases[0][2:-1])
    pattern = re.compile(r'<script\s+src=["\']' + re.escape(ANCHOR) + r'["\']\s*>\s*</script>', re.I)
    if len(pattern.findall(html)) != 1 or PATCH in html:
        raise BuildError("A base deve incluir o patch 117 exatamente uma vez e ainda não incluir o patch 118.")
    newline = "\r\n" if "\r\n" in html else "\n"
    html = pattern.sub(lambda match: match.group(0) + newline + f'<script src="./src/runtime/v82/{PATCH}"></script>', html, count=1)
    title = "<title>KELVOR — A aventura começa (v047)</title>"
    if len(re.findall(r"<title\b[^>]*>.*?</title>", html, re.I | re.S)) != 1:
        raise BuildError("index.html deve conter exatamente um título.")
    html = re.sub(r"<title\b[^>]*>.*?</title>", lambda _: title, html, count=1, flags=re.I | re.S)
    description = '<meta name="description" content="Entre no mundo de KELVOR: aventura, caminhos vivos e uma nova jornada.">'
    descriptions = re.compile(r'<meta\b(?=[^>]*\bname\s*=\s*["\']description["\'])[^>]*>', re.I)
    if len(descriptions.findall(html)) > 1:
        raise BuildError("index.html contém descrições duplicadas.")
    if descriptions.search(html):
        html = descriptions.sub(lambda _: description, html, count=1)
    else:
        html = html.replace(title, title + newline + description, 1)
    return html.encode("utf-8"), release


def write_report(path: Path, report: dict) -> None:
    temporary = path.with_name(path.name + ".tmp")
    with temporary.open("x", encoding="utf-8", newline="\n") as stream:
        json.dump(report, stream, ensure_ascii=False, indent=2)
        stream.write("\n")
    temporary.replace(path)


def build(args: argparse.Namespace) -> dict:
    for path in (args.baseline, args.output, args.repo):
        if is_link(path.expanduser()):
            raise BuildError(f"Pasta vinculada não permitida: {path}")
    baseline, output, repo = (path.expanduser().resolve() for path in (args.baseline, args.output, args.repo))
    if not baseline.is_dir() or not (baseline / "index.html").is_file() or not (baseline / BASELINE_REPORT).is_file():
        raise BuildError(f"CANDIDATO_V046 com manifesto não encontrado: {baseline}")
    if output == baseline or output.is_relative_to(baseline) or baseline.is_relative_to(output):
        raise BuildError("Base e candidato devem ser pastas separadas, sem relação de ancestralidade.")
    if output == repo or repo.is_relative_to(output) or output.is_relative_to(repo):
        raise BuildError("O candidato deve ficar fora do repositório de edição.")
    before = inventory(baseline)
    baseline_report = json.loads((baseline / BASELINE_REPORT).read_text(encoding="utf-8-sig"))
    payload = {key: record for key, record in before.items() if key != BASELINE_REPORT}
    verify_payload(baseline_report, payload, "kelvor-living-map-v046")
    index_bytes, release = render_index((baseline / "index.html").read_bytes())
    if not (baseline / release).is_dir():
        raise BuildError(f"Diretório de runtime não encontrado: {release}")
    patch = repo / "patches" / PATCH
    if not patch.is_file() or is_link(patch):
        raise BuildError(f"Patch de menus ainda não disponível: {patch}")
    assets_root = repo / "assets" / "menu"
    if not assets_root.is_dir():
        raise BuildError(f"Pasta de arte ainda não disponível: {assets_root}")
    assets = inventory(assets_root)
    if not assets or not any(Path(key).suffix.lower() in {".png", ".webp", ".jpg", ".jpeg", ".avif"} for key in assets):
        raise BuildError("A pasta assets/menu deve conter ao menos uma imagem do novo menu.")
    sources = {f"{release}/src/runtime/v82/{PATCH}": patch}
    sources.update({f"{release}/assets/menu/{key}": assets_root / key for key in assets})
    source_records = {key: {"path": str(path), "bytes": path.stat().st_size, "sha256": digest(path)} for key, path in sources.items()}
    declared = {"index.html", *sources}
    prior = {}
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

    # Reruns update only these declared files. No file or directory is deleted.
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
        "output": str(output), "repo": str(repo), "release_dir": release,
        "baseline": {"path": str(baseline), "tree_sha256": tree_digest(before), "files": len(before), "unchanged_after_build": True,
                     "known_manifest": {"path": str(baseline / BASELINE_REPORT), "sha256": before[BASELINE_REPORT]["sha256"],
                                        "status": "verified", "payload_files": len(payload), "payload_tree_sha256": tree_digest(payload)}},
        "candidate": {"tree_sha256": tree_digest(candidate), "files": len(candidate), "report_excluded_from_hash": REPORT_NAME},
        "declared_files": sorted(declared), "retained_previous_outputs": sorted(prior_owned - declared),
        "sources": source_records, "changes": changes, "base_files": before, "candidate_files": candidate,
        "qa_note": "Build e hashes verificados. Aprovação visual, funções dos menus e aparelhos reais exigem QA separado.",
    }
    write_report(report_path, report)
    return report


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--baseline", required=True, type=Path, help="CANDIDATO_V046 com LIVING_MAP_BUILD_REPORT.json válido.")
    parser.add_argument("--output", required=True, type=Path, help="Pasta nova CANDIDATO_V047 ou destino reconhecido de execução anterior.")
    parser.add_argument("--repo", type=Path, default=Path(__file__).resolve().parents[1], help="Repositório com patches/ e assets/menu/.")
    try:
        report = build(parser.parse_args(argv))
    except (BuildError, OSError, UnicodeError, ValueError, KeyError, TypeError) as error:
        print(f"ERRO: {error}", file=sys.stderr)
        return 1
    print(f"Candidato v047 construído: {report['output']}")
    print(f"Base preservada e manifesto v046 verificado: {report['baseline']['files']} arquivos.")
    print(f"Candidato: {report['candidate']['files']} arquivos; árvore {report['candidate']['tree_sha256']}")
    print(f"Relatório: {Path(report['output']) / REPORT_NAME}")
    print("Status: BUILD_VERIFIED_QA_PENDING")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
