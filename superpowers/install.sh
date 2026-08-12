#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_DIR="${HOME}/.claude"
DRY_RUN=false

usage() {
  cat <<'EOF'
Usage: ./install.sh [--claude-dir PATH] [--dry-run] [--help]

Install the Superpowers skills library (obra/superpowers) into a Claude Code
skills directory.

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

SKILLS_SRC_DIR="${SCRIPT_DIR}/skills"
SKILLS_DEST_DIR="${CLAUDE_DIR}/skills"

if [[ ! -d "${SKILLS_SRC_DIR}" ]]; then
  echo "Error: skills directory not found at ${SKILLS_SRC_DIR}" >&2
  exit 1
fi

shopt -s nullglob
skill_dirs=("${SKILLS_SRC_DIR}"/*/)
shopt -u nullglob

if [[ ${#skill_dirs[@]} -eq 0 ]]; then
  echo "Error: no skills found under ${SKILLS_SRC_DIR}" >&2
  exit 1
fi

echo "Installing Superpowers skills..."
echo "Claude target directory: ${CLAUDE_DIR}"
run_cmd mkdir -p "${SKILLS_DEST_DIR}"

installed_count=0
for skill_dir in "${skill_dirs[@]}"; do
  skill_name="$(basename "${skill_dir}")"
  run_cmd rm -rf "${SKILLS_DEST_DIR:?}/${skill_name}"
  run_cmd cp -R "${skill_dir}" "${SKILLS_DEST_DIR}/${skill_name}"
  ((installed_count += 1))
done

echo
echo "Done."
echo "  Installed ${installed_count} skills to ${SKILLS_DEST_DIR}"
echo "Restart Claude Code afterwards so the new skills are picked up."
echo
echo "Superpowers works best when 'using-superpowers' is loaded automatically"
echo "at the start of every session. See superpowers/hooks/hooks.json and"
echo "https://github.com/obra/superpowers#claude-code for wiring up the"
echo "SessionStart hook by hand (the official plugin installers do this"
echo "for you; /plugin install is not available in this remote environment)."
