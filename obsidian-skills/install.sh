#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_DIR="${HOME}/.claude"
DRY_RUN=false

usage() {
  cat <<'EOF'
Usage: ./install.sh [--claude-dir PATH] [--dry-run] [--help]

Install the obsidian-skills Agent Skills (obsidian-markdown, obsidian-bases,
json-canvas, obsidian-cli, defuddle) into a Claude Code skills directory.

Options:
  --claude-dir PATH  Target Claude config directory (default: ~/.claude)
  --dry-run          Print actions without writing files
  --help             Show this help message
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

SKILLS_SRC_DIR="${SCRIPT_DIR}/skills"
if [[ ! -d "${SKILLS_SRC_DIR}" ]]; then
  echo "Error: skills directory not found at ${SKILLS_SRC_DIR}" >&2
  exit 1
fi

SKILLS_DEST_DIR="${CLAUDE_DIR}/skills"
echo "Installing obsidian-skills into ${SKILLS_DEST_DIR}..."
run_cmd mkdir -p "${SKILLS_DEST_DIR}"

installed_count=0
for skill_dir in "${SKILLS_SRC_DIR}"/*/; do
  skill_name="$(basename "${skill_dir}")"
  dest_dir="${SKILLS_DEST_DIR}/${skill_name}"
  echo "Installing skill: ${skill_name}"
  run_cmd rm -rf "${dest_dir}"
  run_cmd cp -r "${skill_dir%/}" "${dest_dir}"
  ((installed_count+=1))
done

echo
echo "Done. Installed ${installed_count} skills to ${SKILLS_DEST_DIR}:"
for skill_dir in "${SKILLS_SRC_DIR}"/*/; do
  echo "  - $(basename "${skill_dir}")"
done
echo "Restart Claude Code afterwards so the new skills are picked up."
