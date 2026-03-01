#!/usr/bin/env python3
"""
Context Drift Detection for HBC Project Controls.

Checks recent git commits for changes in core code paths without corresponding
updates to docs/specs/*.md or CLAUDE.md. Also flags debugging-heavy sessions
(when run manually before a Claude Code session).

Output goes to stdout – inject into your Claude session manually or via terminal.

Usage:
    python3 tools/context-drift-check.py
    python3 tools/context-drift-check.py --dismiss   # Dismiss current warnings
"""

import json
import os
import subprocess
import sys
import time
from pathlib import Path

MAX_COMMITS = 10
MAX_SESSIONS = 3
DEBUG_SCORE_THRESHOLD = 40
DISMISS_MAX_SHOWS = 3
STATE_FILE = "tools/.drift-state.json"

# HBC-specific monitored areas (grounded in commit 83db2ad9e8b0b8f164562564dbff4fad554d4e8b)
MONITORED_CODE_PATHS = [
    "src/webparts/hbcProjectControls/",
    "packages/hbc-sp-services/",
]

MONITORED_DOC_PATHS = [
    "docs/specs/",
    "CLAUDE.md",
]

DEBUG_KEYWORDS = [
    "fix", "bug", "broken", "doesn't work", "not working", "issue", "error",
    "exception", "crash", "wrong", "still not", "why does", "kickoff", "baseline",
    "resolveValue", "change order", "RFI", "EVMS", "float",
]

def find_repo_root() -> Path | None:
    cwd = Path.cwd()
    if (cwd / ".git").exists():
        return cwd
    # Walk up from tools/
    candidate = Path(__file__).resolve().parent.parent
    if (candidate / ".git").exists():
        return candidate
    return None

def get_head_sha(repo_root: Path) -> str | None:
    try:
        result = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            capture_output=True, text=True, timeout=3, cwd=repo_root,
        )
        return result.stdout.strip() if result.returncode == 0 else None
    except Exception:
        return None

def load_state(repo_root: Path) -> dict:
    state_path = repo_root / STATE_FILE
    if state_path.exists():
        try:
            return json.loads(state_path.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {}

def save_state(repo_root: Path, state: dict) -> None:
    (repo_root / STATE_FILE).write_text(json.dumps(state), encoding="utf-8")

def detect_code_doc_drift(repo_root: Path) -> list:
    """Simple drift detection: code changed without doc update."""
    try:
        result = subprocess.run(
            ["git", "log", f"--max-count={MAX_COMMITS}", "--name-only", "--format=%H"],
            capture_output=True, text=True, timeout=3, cwd=repo_root,
        )
        if result.returncode != 0:
            return []
    except Exception:
        return []

    commits = []
    current = []
    for line in result.stdout.strip().split("\n"):
        line = line.strip()
        if len(line) == 40 and all(c in "0123456789abcdef" for c in line):
            if current:
                commits.append(current)
            current = []
        elif line:
            current.append(line)
    if current:
        commits.append(current)

    all_code_touched = set()
    all_doc_touched = set()

    for files in commits:
        for f in files:
            if any(f.startswith(p) for p in MONITORED_CODE_PATHS):
                all_code_touched.add(f)
            if any(f.startswith(p) for p in MONITORED_DOC_PATHS):
                all_doc_touched.add(f)

    if not all_code_touched:
        return []

    # If any code touched and no doc touched → drift
    if all_code_touched and not all_doc_touched:
        return [{
            "warning": "CODE CHANGED WITHOUT SPEC UPDATE",
            "code_files": list(all_code_touched)[:5],
            "expected_docs": ["docs/specs/*.md and/or CLAUDE.md"],
            "suggestion": "Run find_relevant_context() then update the highest-relevance spec.",
        }]
    return []

def format_output(drift: list, times_shown: int = 0) -> str:
    if not drift:
        return ""
    remaining = max(0, DISMISS_MAX_SHOWS - times_shown)
    dismiss_note = f" (showing {times_shown}/{DISMISS_MAX_SHOWS} — auto-dismisses after {remaining} more)"
    lines = [f"CONTEXT DRIFT DETECTED{dismiss_note}:"]
    for item in drift:
        lines.append(f"  • {item['warning']}")
        lines.append(f"    Code: {', '.join(item['code_files'])}")
        lines.append(f"    Update: {', '.join(item['expected_docs'])}")
        lines.append(f"    Action: {item['suggestion']}")
    return "\n".join(lines)

def main():
    repo_root = find_repo_root()
    if not repo_root:
        print("Could not find repo root.")
        return

    if "--dismiss" in sys.argv:
        head = get_head_sha(repo_root)
        if head:
            save_state(repo_root, {"head_sha": head, "times_shown": DISMISS_MAX_SHOWS})
            print(f"Drift warnings dismissed at {head[:8]}.")
        return

    drift = detect_code_doc_drift(repo_root)

    # Auto-dismiss logic
    head = get_head_sha(repo_root)
    state = load_state(repo_root)
    times_shown = 0

    if drift and head:
        if state.get("head_sha") == head:
            times_shown = state.get("times_shown", 0)
            if times_shown >= DISMISS_MAX_SHOWS:
                drift = []
            else:
                times_shown += 1
                save_state(repo_root, {"head_sha": head, "times_shown": times_shown})
        else:
            times_shown = 1
            save_state(repo_root, {"head_sha": head, "times_shown": 1})
    elif not drift:
        if state:
            save_state(repo_root, {})

    output = format_output(drift, times_shown)
    if output:
        print(output)
    else:
        print("No context drift detected.")

if __name__ == "__main__":
    main()
