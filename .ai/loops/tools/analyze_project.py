#!/usr/bin/env python3
"""Create a privacy-conscious, dependency-free profile of a local project."""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from collections import Counter
from pathlib import Path
from typing import Any

try:
    import tomllib
except ModuleNotFoundError:  # pragma: no cover - Python < 3.11 fallback
    tomllib = None


ANALYZER_VERSION = "1.0"
MAX_TEXT_BYTES = 2_000_000

IGNORED_DIRS = {
    ".git",
    ".hg",
    ".svn",
    ".next",
    ".nuxt",
    ".output",
    ".turbo",
    ".venv",
    "venv",
    "__pycache__",
    "node_modules",
    "vendor",
    "target",
    "dist",
    "build",
    "coverage",
    ".coverage",
    ".pytest_cache",
    ".mypy_cache",
    ".ruff_cache",
    ".gradle",
    "DerivedData",
    "Pods",
}

ALLOWED_HIDDEN_DIRS = {
    ".agents",
    ".claude",
    ".codex",
    ".gemini",
    ".github",
    ".gitlab",
    ".circleci",
    ".vscode",
}

SENSITIVE_NAMES = {
    ".env",
    ".env.local",
    ".env.production",
    ".env.development",
    "id_rsa",
    "id_ed25519",
    "credentials.json",
    "service-account.json",
    "serviceaccount.json",
}

SENSITIVE_SUFFIXES = {
    ".pem",
    ".key",
    ".p12",
    ".pfx",
    ".jks",
    ".keystore",
}

DOC_NAMES = {
    "agents.md",
    "claude.md",
    "gemini.md",
    "readme.md",
    "readme",
    "contributing.md",
    "architecture.md",
    "prd.md",
    "spec.md",
    "design.md",
    "design-system.md",
}

MANIFEST_NAMES = {
    "package.json",
    "pyproject.toml",
    "requirements.txt",
    "poetry.lock",
    "uv.lock",
    "go.mod",
    "cargo.toml",
    "composer.json",
    "pom.xml",
    "build.gradle",
    "build.gradle.kts",
    "settings.gradle",
    "settings.gradle.kts",
    "pubspec.yaml",
    "mix.exs",
    "gemfile",
    "podfile",
    "package.swift",
}

INFRA_NAMES = {
    "dockerfile",
    "docker-compose.yml",
    "docker-compose.yaml",
    "compose.yml",
    "compose.yaml",
    "vercel.json",
    "netlify.toml",
    "firebase.json",
    "firestore.rules",
    "storage.rules",
    "fly.toml",
    "render.yaml",
    "serverless.yml",
    "serverless.yaml",
    "terraform.tf",
}

TEST_PARTS = {
    "test",
    "tests",
    "__tests__",
    "spec",
    "specs",
    "e2e",
    "integration",
}

LANGUAGE_BY_SUFFIX = {
    ".ts": "TypeScript",
    ".tsx": "TypeScript",
    ".js": "JavaScript",
    ".jsx": "JavaScript",
    ".mjs": "JavaScript",
    ".cjs": "JavaScript",
    ".py": "Python",
    ".go": "Go",
    ".rs": "Rust",
    ".java": "Java",
    ".kt": "Kotlin",
    ".kts": "Kotlin",
    ".swift": "Swift",
    ".dart": "Dart",
    ".php": "PHP",
    ".rb": "Ruby",
    ".cs": "C#",
    ".cpp": "C++",
    ".cc": "C++",
    ".c": "C",
    ".scala": "Scala",
    ".ex": "Elixir",
    ".exs": "Elixir",
    ".sql": "SQL",
    ".html": "HTML",
    ".css": "CSS",
    ".scss": "SCSS",
    ".sass": "Sass",
    ".vue": "Vue",
    ".svelte": "Svelte",
    ".md": "Markdown",
    ".ipynb": "Jupyter Notebook",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Analyze a project without reading secret files."
    )
    parser.add_argument("root", nargs="?", default=".", help="Project root")
    parser.add_argument("--output", "-o", help="Write JSON to this path")
    parser.add_argument(
        "--max-files",
        type=int,
        default=20_000,
        help="Maximum files to inspect (default: 20000)",
    )
    return parser.parse_args()


def is_sensitive(path: Path) -> bool:
    lower = path.name.lower()
    if lower in SENSITIVE_NAMES or path.suffix.lower() in SENSITIVE_SUFFIXES:
        return True
    if lower.startswith(".env."):
        return True
    return any(
        token in lower
        for token in ("secret", "credential", "private-key", "service-account")
    )


def read_text(path: Path) -> str:
    if is_sensitive(path):
        return ""
    try:
        if path.stat().st_size > MAX_TEXT_BYTES:
            return ""
        return path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""


def load_json(path: Path) -> dict[str, Any]:
    text = read_text(path)
    if not text:
        return {}
    try:
        value = json.loads(text)
        return value if isinstance(value, dict) else {}
    except json.JSONDecodeError:
        return {}


def collect_files(root: Path, max_files: int) -> tuple[list[Path], bool]:
    files: list[Path] = []
    truncated = False
    for current, dirs, names in os.walk(root):
        dirs[:] = sorted(
            directory
            for directory in dirs
            if directory not in IGNORED_DIRS
            and (
                not directory.startswith(".")
                or directory in ALLOWED_HIDDEN_DIRS
            )
        )
        for name in sorted(names):
            path = Path(current) / name
            files.append(path)
            if len(files) >= max_files:
                truncated = True
                return files, truncated
    return files, truncated


def rel(path: Path, root: Path) -> str:
    return path.relative_to(root).as_posix()


def package_profile(root: Path) -> tuple[dict[str, Any], set[str], list[str]]:
    package_path = root / "package.json"
    package = load_json(package_path) if package_path.exists() else {}
    dependencies: set[str] = set()
    scripts: list[str] = []
    for key in ("dependencies", "devDependencies", "peerDependencies"):
        value = package.get(key, {})
        if isinstance(value, dict):
            dependencies.update(str(item).lower() for item in value)
    raw_scripts = package.get("scripts", {})
    if isinstance(raw_scripts, dict):
        scripts = sorted(str(name) for name in raw_scripts)
    summary = {
        "name": package.get("name") if isinstance(package.get("name"), str) else None,
        "private": package.get("private") if isinstance(package.get("private"), bool) else None,
        "workspaces": bool(package.get("workspaces")),
        "scripts": scripts,
    }
    return summary, dependencies, scripts


def detect_stack(
    files: list[Path], root: Path, dependencies: set[str]
) -> tuple[list[str], Counter[str]]:
    language_counts: Counter[str] = Counter()
    for path in files:
        language = LANGUAGE_BY_SUFFIX.get(path.suffix.lower())
        if language:
            language_counts[language] += 1

    stack: set[str] = set()
    dependency_map = {
        "react": "React",
        "react-native": "React Native",
        "expo": "Expo",
        "next": "Next.js",
        "nuxt": "Nuxt",
        "vue": "Vue",
        "svelte": "Svelte",
        "vite": "Vite",
        "firebase": "Firebase",
        "@firebase/app": "Firebase",
        "@supabase/supabase-js": "Supabase",
        "typescript": "TypeScript",
        "jest": "Jest",
        "vitest": "Vitest",
        "@playwright/test": "Playwright",
        "cypress": "Cypress",
        "eslint": "ESLint",
        "sass": "Sass",
        "tailwindcss": "Tailwind CSS",
        "express": "Express",
        "fastify": "Fastify",
        "nestjs": "NestJS",
        "@nestjs/core": "NestJS",
        "stripe": "Stripe",
    }
    for dependency, label in dependency_map.items():
        if dependency in dependencies:
            stack.add(label)

    names = {path.name.lower() for path in files}
    if "pyproject.toml" in names or "requirements.txt" in names:
        stack.add("Python")
    if "go.mod" in names:
        stack.add("Go")
    if "cargo.toml" in names:
        stack.add("Rust")
    if "pubspec.yaml" in names:
        stack.add("Dart/Flutter")
    if "pom.xml" in names:
        stack.add("Maven")
    if "build.gradle" in names or "build.gradle.kts" in names:
        stack.add("Gradle")
    if "firebase.json" in names or "firestore.rules" in names:
        stack.add("Firebase")
    if any(path.suffix.lower() == ".ipynb" for path in files):
        stack.add("Jupyter")
    if (root / "android").is_dir():
        stack.add("Android")
    if (root / "ios").is_dir():
        stack.add("iOS")
    return sorted(stack), language_counts


def detect_commands(
    root: Path,
    names: set[str],
    dependencies: set[str],
    package_scripts: list[str],
) -> dict[str, list[str]]:
    commands: dict[str, list[str]] = {
        "install": [],
        "test": [],
        "lint": [],
        "typecheck": [],
        "build": [],
        "format": [],
        "other": [],
    }

    if "package.json" in names:
        if (root / "pnpm-lock.yaml").exists():
            runner = "pnpm"
            commands["install"].append("pnpm install")
        elif (root / "yarn.lock").exists():
            runner = "yarn"
            commands["install"].append("yarn install")
        elif (root / "bun.lock").exists() or (root / "bun.lockb").exists():
            runner = "bun"
            commands["install"].append("bun install")
        else:
            runner = "npm"
            commands["install"].append(
                "npm ci" if (root / "package-lock.json").exists() else "npm install"
            )
        for script in package_scripts:
            command = f"{runner} run {script}"
            lower = script.lower()
            if "test" in lower:
                commands["test"].append(command)
            elif "lint" in lower:
                commands["lint"].append(command)
            elif "type" in lower or "check" == lower:
                commands["typecheck"].append(command)
            elif "build" in lower:
                commands["build"].append(command)
            elif "format" in lower or "prettier" in lower:
                commands["format"].append(command)

    if "pyproject.toml" in names or "requirements.txt" in names:
        if "pytest" in dependencies or (root / "pytest.ini").exists():
            commands["test"].append("pytest")
        if "ruff" in dependencies:
            commands["lint"].append("ruff check .")
            commands["format"].append("ruff format --check .")
        if "mypy" in dependencies:
            commands["typecheck"].append("mypy .")
    if "go.mod" in names:
        commands["test"].append("go test ./...")
        commands["build"].append("go build ./...")
    if "cargo.toml" in names:
        commands["test"].append("cargo test")
        commands["lint"].append("cargo clippy")
        commands["build"].append("cargo build")
    if "pubspec.yaml" in names:
        commands["test"].append("flutter test")
        commands["lint"].append("flutter analyze")
        commands["build"].append("flutter build")
    if "pom.xml" in names:
        commands["test"].append("mvn test")
        commands["build"].append("mvn package")
    if "build.gradle" in names or "build.gradle.kts" in names:
        commands["test"].append("./gradlew test")
        commands["build"].append("./gradlew build")

    return {key: sorted(set(value)) for key, value in commands.items()}


def classify_project(
    files: list[Path],
    root: Path,
    stack: list[str],
    language_counts: Counter[str],
    dependencies: set[str],
) -> list[str]:
    scores: Counter[str] = Counter()
    names = {path.name.lower() for path in files}
    relative_paths = [rel(path, root).lower() for path in files]

    code_files = sum(
        count for language, count in language_counts.items() if language != "Markdown"
    )
    markdown_files = language_counts.get("Markdown", 0)

    if code_files:
        scores["software"] += 3
    if "React Native" in stack or "Expo" in stack or "Dart/Flutter" in stack:
        scores["mobile"] += 5
    if any(item in stack for item in ("Next.js", "Vue", "Nuxt", "Svelte")) or (
        "React" in stack and "React Native" not in stack
    ):
        scores["web"] += 4
    if any(
        token in path
        for path in relative_paths
        for token in ("/api/", "/routes/", "/controllers/", "/server/")
    ):
        scores["backend-api"] += 3
    if any(path.endswith(".ipynb") for path in relative_paths):
        scores["data-ml"] += 4
    if {"pandas", "numpy", "scikit-learn", "tensorflow", "torch"} & dependencies:
        scores["data-ml"] += 4
    if markdown_files > max(5, code_files * 2):
        scores["documentation-content"] += 4
    if code_files == 0 and markdown_files:
        scores["documentation-content"] += 4
    if any(name in names for name in ("figma.json", "tokens.json", "style-dictionary.json")):
        scores["design-system"] += 4
    if any(path.startswith("terraform/") or path.endswith(".tf") for path in relative_paths):
        scores["infrastructure"] += 4
    if (root / "packages").is_dir() or (root / "apps").is_dir():
        scores["monorepo"] += 2

    if not scores:
        return ["general"]
    highest = max(scores.values())
    return [
        name
        for name, score in scores.most_common()
        if score >= max(2, highest - 2)
    ]


def detect_risks(
    files: list[Path],
    root: Path,
    stack: list[str],
    dependencies: set[str],
    has_tests: bool,
    has_ci: bool,
) -> list[dict[str, str]]:
    paths = [rel(path, root).lower() for path in files]
    names = {path.name.lower() for path in files}
    risks: list[dict[str, str]] = []

    def add(signal: str, evidence: str) -> None:
        risks.append({"signal": signal, "evidence": evidence})

    if not has_tests:
        add("missing-tests", "Nenhum diretório ou arquivo de teste foi detectado.")
    if not has_ci:
        add("missing-ci", "Nenhuma configuração comum de integração contínua foi detectada.")
    if {"firebase", "@firebase/app", "@supabase/supabase-js"} & dependencies or any(
        item in stack for item in ("Firebase", "Supabase")
    ):
        add("managed-backend", "Dependência ou configuração de backend gerenciado detectada.")
    if any(token in dependencies for token in ("next-auth", "passport", "auth0")) or any(
        re.search(r"(^|[/_.-])auth([/_.-]|$)", path) for path in paths
    ):
        add("authentication", "Dependência relacionada a autenticação detectada.")
    if "stripe" in dependencies or any("payment" in path for path in paths):
        add("payments", "Integração ou código relacionado a pagamentos detectado.")
    if any(item in stack for item in ("React Native", "Expo", "Dart/Flutter", "Android", "iOS")):
        add("mobile-release", "Projeto móvel ou plataformas móveis detectadas.")
    if any("migration" in path for path in paths):
        add("database-migrations", "Arquivos de migração detectados.")
    if any(name in names for name in ("firestore.rules", "storage.rules")):
        add("access-rules", "Regras de acesso do backend detectadas.")
    if any(
        path.startswith(".github/workflows/")
        or path in (".gitlab-ci.yml", "azure-pipelines.yml")
        for path in paths
    ):
        add("automated-pipeline", "Pipeline de CI detectado.")
    if any(name in names for name in ("vercel.json", "netlify.toml", "fly.toml", "render.yaml")):
        add("deployment-config", "Configuração de deploy detectada.")
    if any(is_sensitive(path) for path in files):
        add("sensitive-files", "Nomes de arquivos potencialmente sensíveis foram detectados e não foram lidos.")
    return risks


def frontmatter_status(path: Path) -> str:
    text = read_text(path)
    if not text.startswith("---"):
        return "unknown"
    for line in text.splitlines()[1:80]:
        if line.strip() == "---":
            break
        match = re.match(r"^status:\s*[\"']?([^\"']+?)[\"']?\s*$", line.strip())
        if match:
            return match.group(1).strip().lower()
    return "unknown"


def detect_foundation(
    files: list[Path],
    root: Path,
    language_counts: Counter[str],
    manifests: list[str],
) -> dict[str, Any]:
    relative_paths = {rel(path, root) for path in files}
    ignored_for_stage = {
        ".DS_Store",
        ".gitignore",
        ".gitattributes",
        ".gitkeep",
        "LICENSE",
    }
    meaningful = [
        path
        for path in relative_paths
        if path not in ignored_for_stage
        and not path.startswith(".ai/loops/")
        and not path.startswith(".agents/skills/project-loops/")
        and not path.startswith(".claude/skills/project-loops/")
    ]
    code_count = sum(
        count for language, count in language_counts.items() if language != "Markdown"
    )

    if not meaningful:
        stage = "not-started"
    elif not manifests and code_count == 0:
        stage = "foundation"
    elif manifests and code_count <= 3:
        stage = "scaffold"
    else:
        stage = "active"

    candidates = {
        "briefing": ("docs/briefing.md", "briefing.md"),
        "prd": ("docs/prd.md", "prd.md"),
        "spec": ("docs/spec.md", "spec.md"),
        "dag": ("docs/execucao/dag.md", "docs/dag.md", "dag.md"),
    }
    documents: dict[str, dict[str, str]] = {}
    for name, paths in candidates.items():
        selected = next((path for path in paths if path in relative_paths), None)
        documents[name] = {
            "path": selected or paths[0],
            "status": frontmatter_status(root / selected) if selected else "missing",
        }

    order = ("briefing", "prd", "spec", "dag")
    next_gate = "implementation"
    for name in order:
        if documents[name]["status"] != "approved":
            next_gate = name
            break

    return {
        "stage": stage,
        "required_sequence": [
            "briefing",
            "prd",
            "spec",
            "dag",
            "implementation",
        ],
        "documents": documents,
        "next_gate": next_gate,
        "implementation_allowed": next_gate == "implementation",
    }


def main() -> int:
    args = parse_args()
    root = Path(args.root).resolve()
    if root.is_file():
        root = root.parent
    if not root.exists() or not root.is_dir():
        print(f"Project root does not exist: {root}", file=sys.stderr)
        return 2

    files, truncated = collect_files(root, max(1, args.max_files))
    relative_paths = [rel(path, root) for path in files]
    lower_names = {path.name.lower() for path in files}
    package, dependencies, package_scripts = package_profile(root)

    requirements = root / "requirements.txt"
    if requirements.exists():
        for line in read_text(requirements).splitlines():
            item = re.split(r"[<>=!~\[]", line.strip(), maxsplit=1)[0].lower()
            if item and not item.startswith("#"):
                dependencies.add(item)

    pyproject = root / "pyproject.toml"
    if pyproject.exists() and tomllib is not None:
        try:
            data = tomllib.loads(read_text(pyproject))
            project = data.get("project", {})
            if isinstance(project, dict):
                for item in project.get("dependencies", []) or []:
                    name = re.split(r"[<>=!~\[\s]", str(item), maxsplit=1)[0].lower()
                    if name:
                        dependencies.add(name)
            tool = data.get("tool", {})
            if isinstance(tool, dict):
                dependencies.update(str(name).lower() for name in tool)
        except (ValueError, TypeError):
            pass

    stack, language_counts = detect_stack(files, root, dependencies)
    has_tests = any(
        bool(set(Path(path).parts) & TEST_PARTS)
        or re.search(r"(^|[._-])(test|spec)([._-]|$)", Path(path).name.lower())
        for path in relative_paths
    )
    has_ci = any(
        path.startswith(".github/workflows/")
        or path in (".gitlab-ci.yml", "azure-pipelines.yml", "bitbucket-pipelines.yml")
        or path.startswith(".circleci/")
        for path in (item.lower() for item in relative_paths)
    )

    instructions = sorted(
        path
        for path in relative_paths
        if Path(path).name.lower() in DOC_NAMES
        or path.lower().endswith("copilot-instructions.md")
    )
    manifests = sorted(
        path for path in relative_paths if Path(path).name.lower() in MANIFEST_NAMES
    )
    infrastructure = sorted(
        path
        for path in relative_paths
        if Path(path).name.lower() in INFRA_NAMES
        or path.lower().startswith(".github/workflows/")
        or path.lower().endswith(".tf")
    )
    sensitive = sorted(
        path for path, actual in zip(relative_paths, files) if is_sensitive(actual)
    )
    top_level = sorted(
        item.name
        for item in root.iterdir()
        if item.name not in IGNORED_DIRS
        and (not item.name.startswith(".") or item.name in ALLOWED_HIDDEN_DIRS)
    )
    commands = detect_commands(
        root, lower_names, dependencies, package_scripts
    )
    project_types = classify_project(
        files, root, stack, language_counts, dependencies
    )
    risks = detect_risks(
        files, root, stack, dependencies, has_tests, has_ci
    )

    foundation = detect_foundation(files, root, language_counts, manifests)

    profile: dict[str, Any] = {
        "analyzer_version": ANALYZER_VERSION,
        "project": {
            "name": package.get("name") or root.name,
            "root": ".",
            "types": project_types,
            "stack": stack,
            "languages": [
                {"name": name, "files": count}
                for name, count in language_counts.most_common()
            ],
            "monorepo": bool(package.get("workspaces"))
            or (root / "packages").is_dir()
            or (root / "apps").is_dir(),
            "stage": foundation["stage"],
        },
        "evidence": {
            "file_count_scanned": len(files),
            "scan_truncated": truncated,
            "top_level": top_level,
            "manifests": manifests,
            "instructions_and_docs": instructions,
            "infrastructure": infrastructure,
            "has_tests": has_tests,
            "has_ci": has_ci,
            "package_scripts": package.get("scripts", []),
            "sensitive_file_names_detected": sensitive,
        },
        "commands": commands,
        "risk_signals": risks,
        "foundation": foundation,
        "selection_notes": [
            "Confirmar comandos no projeto antes de executá-los.",
            "Não ler arquivos sensíveis listados no perfil.",
            "Selecionar loops somente quando houver evidência correspondente.",
            "Respeitar Briefing, PRD, Spec e DAG aprovados antes da implementação.",
        ],
    }

    output = json.dumps(profile, indent=2, ensure_ascii=False) + "\n"
    if args.output:
        destination = Path(args.output).resolve()
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(output, encoding="utf-8")
    else:
        sys.stdout.write(output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
