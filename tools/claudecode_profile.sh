#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLAUDE_DIR="$ROOT_DIR/.claude"
ACTIVE_SETTINGS="$CLAUDE_DIR/settings.local.json"
LOCAL_PROFILE="$CLAUDE_DIR/settings.local.caloudecode.json"
BACKUP_SETTINGS="$CLAUDE_DIR/settings.local.backup.json"

usage() {
  cat <<USAGE
Usage:
  tools/claudecode_profile.sh init
  tools/claudecode_profile.sh status
  tools/claudecode_profile.sh switch-local
  tools/claudecode_profile.sh restore
  tools/claudecode_profile.sh run-local [claude args...]

Commands:
  init          Create local profile from current settings if missing.
  status        Show which settings files exist.
  switch-local  Backup current settings.local.json and replace with local profile.
  restore       Restore settings.local.json from backup.
  run-local     Start Claude with local profile without replacing active settings.
USAGE
}

ensure_claude_dir() {
  mkdir -p "$CLAUDE_DIR"
}

cmd_init() {
  ensure_claude_dir
  if [[ -f "$LOCAL_PROFILE" ]]; then
    echo "Local profile already exists: $LOCAL_PROFILE"
    return 0
  fi

  if [[ -f "$ACTIVE_SETTINGS" ]]; then
    cp "$ACTIVE_SETTINGS" "$LOCAL_PROFILE"
    echo "Created local profile from active settings: $LOCAL_PROFILE"
  else
    cat > "$LOCAL_PROFILE" <<JSON
{
  "permissions": {
    "allow": []
  }
}
JSON
    echo "Created empty local profile: $LOCAL_PROFILE"
  fi
}

cmd_status() {
  echo "Root: $ROOT_DIR"
  echo "Active settings: $ACTIVE_SETTINGS"
  [[ -f "$ACTIVE_SETTINGS" ]] && echo "  - exists" || echo "  - missing"
  echo "Local profile:  $LOCAL_PROFILE"
  [[ -f "$LOCAL_PROFILE" ]] && echo "  - exists" || echo "  - missing"
  echo "Backup:         $BACKUP_SETTINGS"
  [[ -f "$BACKUP_SETTINGS" ]] && echo "  - exists" || echo "  - missing"
}

cmd_switch_local() {
  ensure_claude_dir
  if [[ ! -f "$LOCAL_PROFILE" ]]; then
    echo "Local profile not found. Run: tools/claudecode_profile.sh init" >&2
    exit 1
  fi

  if [[ -f "$ACTIVE_SETTINGS" ]]; then
    cp "$ACTIVE_SETTINGS" "$BACKUP_SETTINGS"
    echo "Backed up active settings: $BACKUP_SETTINGS"
  fi

  cp "$LOCAL_PROFILE" "$ACTIVE_SETTINGS"
  echo "Switched active settings to local profile."
  echo "Restart Claude Code to apply changes."
}

cmd_restore() {
  if [[ ! -f "$BACKUP_SETTINGS" ]]; then
    echo "Backup not found: $BACKUP_SETTINGS" >&2
    exit 1
  fi

  cp "$BACKUP_SETTINGS" "$ACTIVE_SETTINGS"
  echo "Restored active settings from backup."
  echo "Restart Claude Code to apply changes."
}

cmd_run_local() {
  if ! command -v claude >/dev/null 2>&1; then
    echo "'claude' command not found in PATH." >&2
    exit 1
  fi

  if [[ ! -f "$LOCAL_PROFILE" ]]; then
    echo "Local profile not found. Run: tools/claudecode_profile.sh init" >&2
    exit 1
  fi

  echo "Running Claude with local profile (without replacing active settings)..."
  exec claude --settings "$LOCAL_PROFILE" "$@"
}

main() {
  local cmd="${1:-}"
  case "$cmd" in
    init)
      cmd_init
      ;;
    status)
      cmd_status
      ;;
    switch-local)
      cmd_switch_local
      ;;
    restore)
      cmd_restore
      ;;
    run-local)
      shift || true
      cmd_run_local "$@"
      ;;
    -h|--help|help|"")
      usage
      ;;
    *)
      echo "Unknown command: $cmd" >&2
      usage
      exit 1
      ;;
  esac
}

main "$@"
