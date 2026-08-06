#!/usr/bin/env python3
"""Validate a project-local loop engineering system."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


REQUIRED_WORKFLOW_HEADINGS = {
    "## Objetivo",
    "## Gatilhos",
    "## Entradas",
    "## Etapas",
    "## Verificação",
    "## Condições de parada",
    "## Saída",
}

REQUIRED_FILES = {
    ".ai/loops/registry.json",
    ".ai/loops/project-profile.json",
    ".ai/loops/contract.md",
    ".ai/loops/RUNBOOK.md",
    ".ai/loops/verifiers/definition-of-done.md",
    ".ai/loops/memory/decisions.md",
    ".ai/loops/references/catalog.md",
    ".ai/loops/references/foundation.md",
    ".ai/loops/references/selection-rules.md",
    ".ai/loops/tools/analyze_project.py",
    ".ai/loops/tools/validate_loops.py",
    ".agents/skills/project-loops/SKILL.md",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate generated project loops.")
    parser.add_argument("root", nargs="?", default=".", help="Project root")
    parser.add_argument("--json", action="store_true", help="Emit JSON result")
    return parser.parse_args()


def load_json(path: Path, errors: list[str]) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except OSError as exc:
        errors.append(f"Não foi possível ler {path}: {exc}")
        return {}
    except json.JSONDecodeError as exc:
        errors.append(f"JSON inválido em {path}: linha {exc.lineno}, coluna {exc.colno}")
        return {}
    if not isinstance(value, dict):
        errors.append(f"{path} deve conter um objeto JSON na raiz.")
        return {}
    return value


def is_safe_relative_path(value: str) -> bool:
    path = Path(value)
    return bool(value) and not path.is_absolute() and ".." not in path.parts


def frontmatter_name(path: Path) -> str | None:
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except OSError:
        return None
    if not lines or lines[0].strip() != "---":
        return None
    for line in lines[1:]:
        if line.strip() == "---":
            break
        if line.startswith("name:"):
            return line.split(":", 1)[1].strip().strip("\"'")
    return None


def main() -> int:
    args = parse_args()
    root = Path(args.root).resolve()
    base = root / ".ai" / "loops"
    errors: list[str] = []
    warnings: list[str] = []

    for relative in sorted(REQUIRED_FILES):
        if not (root / relative).is_file():
            errors.append(f"Arquivo obrigatório ausente: {relative}")

    registry_path = base / "registry.json"
    registry = load_json(registry_path, errors) if registry_path.is_file() else {}

    if registry:
        if registry.get("schema_version") != "1.0":
            errors.append("registry.json deve usar schema_version \"1.0\".")
        project = registry.get("project")
        if not isinstance(project, dict) or not isinstance(project.get("name"), str):
            errors.append("registry.json precisa de project.name.")
        defaults = registry.get("defaults")
        if not isinstance(defaults, dict):
            errors.append("registry.json precisa de defaults.")
        else:
            iterations = defaults.get("max_iterations")
            if not isinstance(iterations, int) or not 1 <= iterations <= 10:
                errors.append("defaults.max_iterations deve ser inteiro entre 1 e 10.")

        loops = registry.get("loops")
        if not isinstance(loops, list) or not loops:
            errors.append("registry.json precisa de pelo menos um loop.")
            loops = []

        seen_ids: set[str] = set()
        for index, loop in enumerate(loops):
            label = f"loops[{index}]"
            if not isinstance(loop, dict):
                errors.append(f"{label} deve ser um objeto.")
                continue
            loop_id = loop.get("id")
            if not isinstance(loop_id, str) or not loop_id:
                errors.append(f"{label}.id é obrigatório.")
                continue
            if loop_id in seen_ids:
                errors.append(f"ID de loop duplicado: {loop_id}")
            seen_ids.add(loop_id)

            for field in ("title", "kind", "workflow"):
                if not isinstance(loop.get(field), str) or not loop[field]:
                    errors.append(f"{label}.{field} é obrigatório.")

            trigger = loop.get("trigger")
            if not isinstance(trigger, dict) or not isinstance(trigger.get("type"), str):
                errors.append(f"{label}.trigger.type é obrigatório.")

            workflow = loop.get("workflow")
            if isinstance(workflow, str):
                if not is_safe_relative_path(workflow):
                    errors.append(f"Caminho inseguro em {label}.workflow: {workflow}")
                else:
                    workflow_path = base / workflow
                    if not workflow_path.is_file():
                        errors.append(f"Workflow ausente para {loop_id}: {workflow}")
                    else:
                        text = workflow_path.read_text(encoding="utf-8")
                        missing = sorted(
                            heading
                            for heading in REQUIRED_WORKFLOW_HEADINGS
                            if heading not in text
                        )
                        if missing:
                            errors.append(
                                f"Workflow {workflow} sem seções: {', '.join(missing)}"
                            )

            verifiers = loop.get("verifiers")
            if not isinstance(verifiers, list) or not verifiers:
                errors.append(f"{label}.verifiers precisa de pelo menos um item.")
            else:
                for verifier in verifiers:
                    if not isinstance(verifier, str) or not is_safe_relative_path(verifier):
                        errors.append(f"Verificador inválido em {label}: {verifier!r}")
                        continue
                    if not (base / verifier).is_file():
                        errors.append(f"Verificador ausente em {label}: {verifier}")

            stop_conditions = loop.get("stop_conditions")
            if not isinstance(stop_conditions, list) or not stop_conditions:
                errors.append(f"{label}.stop_conditions precisa de pelo menos um item.")

    project_skill = root / ".agents" / "skills" / "project-loops" / "SKILL.md"
    if project_skill.is_file() and frontmatter_name(project_skill) != "project-loops":
        errors.append(
            ".agents/skills/project-loops/SKILL.md deve declarar name: project-loops."
        )

    claude_skill = root / ".claude" / "skills" / "project-loops" / "SKILL.md"
    if claude_skill.exists() and frontmatter_name(claude_skill) != "project-loops":
        errors.append(
            ".claude/skills/project-loops/SKILL.md deve declarar name: project-loops."
        )
    if not claude_skill.exists():
        warnings.append(
            "Adaptador do Claude Code ausente. Isso é aceitável se Claude Code não estiver no escopo."
        )

    profile_path = base / "project-profile.json"
    if profile_path.is_file():
        profile = load_json(profile_path, errors)
        if not isinstance(profile.get("project"), dict):
            errors.append("project-profile.json precisa de project.")

    result = {
        "valid": not errors,
        "errors": errors,
        "warnings": warnings,
    }
    if args.json:
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        if errors:
            print("ERROS")
            for item in errors:
                print(f"- {item}")
        if warnings:
            print("AVISOS")
            for item in warnings:
                print(f"- {item}")
        if not errors:
            print("Sistema de loops válido.")
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
