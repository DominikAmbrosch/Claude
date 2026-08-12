#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_DIR="${HOME}/.claude"
DRY_RUN=false

usage() {
  cat <<'EOF'
Usage: ./install.sh [--claude-dir PATH] [--dry-run] [--help]

Install the grill-me skill (mattpocock/skills) into a Claude Code skills
directory.

Options:
  --claude-dir PATH   Target Claude config directory (default: ~/.claude)
  --dry-run           Print actions without writing files
  --help              Show this help message
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --claude-dir)
      if [[ $# -lt 2 ]]; then
        echo "Error: --claude-dir requires a path argument" >&2
        usage
        exit 1
      fi
      CLAUDE_DIR="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Error: unknown argument '$1'" >&2
      usage
      exit 1
      ;;
  esac
done

run_cmd() {
  if [[ "$DRY_RUN" == true ]]; then
    echo "[dry-run] $*"
  else
    "$@"
  fi
}

SKILL_SRC_DIR="${SCRIPT_DIR}/skills/grill-me"
SKILL_DEST_DIR="${CLAUDE_DIR}/skills/grill-me"

if [[ ! -f "${SKILL_SRC_DIR}/SKILL.md" ]]; then
  echo "Error: SKILL.md not found at ${SKILL_SRC_DIR}/SKILL.md" >&2
  exit 1
fi

echo "Installing grill-me skill..."
echo "Claude target directory: ${CLAUDE_DIR}"
run_cmd mkdir -p "${CLAUDE_DIR}/skills"
run_cmd rm -rf "${SKILL_DEST_DIR:?}"
run_cmd cp -R "${SKILL_SRC_DIR}" "${SKILL_DEST_DIR}"

echo
echo "Done."
echo "  Installed skill to ${SKILL_DEST_DIR}"
echo "Restart Claude Code afterwards so the new skill is picked up, then use"
echo "/grill-me or say \"grill mich\" to stresstest a plan or decision."
