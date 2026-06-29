#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

load_key_from_env_file() {
  local key="$1"
  local env_file="$ROOT/.env"
  if [[ ! -f "$env_file" ]]; then
    return 1
  fi
  local line
  line="$(grep -E "^[[:space:]]*${key}=" "$env_file" | tail -n 1 || true)"
  if [[ -z "$line" ]]; then
    return 1
  fi
  line="${line#${key}=}"
  line="${line#"${line%%[![:space:]]*}"}"
  line="${line%"${line##*[![:space:]]}"}"
  line="${line#\"}"
  line="${line%\"}"
  line="${line#\'}"
  line="${line%\'}"
  if [[ -z "$line" ]]; then
    return 1
  fi
  printf '%s' "$line"
}

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  VERCEL_TOKEN="$(load_key_from_env_file VERCEL_TOKEN || true)"
  export VERCEL_TOKEN
fi

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "Erreur : VERCEL_TOKEN manquant." >&2
  echo "Ajoutez VERCEL_TOKEN=... dans neotravel-app/.env puis relancez ce script." >&2
  echo "Documentation : docs/DEPLOY-VERCEL.md" >&2
  exit 1
fi

if [[ -z "${VERCEL_SCOPE:-}" ]]; then
  VERCEL_SCOPE="$(load_key_from_env_file VERCEL_SCOPE || true)"
  export VERCEL_SCOPE
fi

SCOPE_ARGS=()
if [[ -n "${VERCEL_SCOPE:-}" ]]; then
  SCOPE_ARGS=(--scope "$VERCEL_SCOPE")
fi

echo "→ Déploiement Vercel (production) depuis $ROOT"
if [[ -n "${VERCEL_SCOPE:-}" ]]; then
  echo "  Équipe (scope) : $VERCEL_SCOPE"
fi

if ((${#SCOPE_ARGS[@]} > 0)); then
  npx vercel deploy --prod --token "$VERCEL_TOKEN" --yes "${SCOPE_ARGS[@]}"
else
  npx vercel deploy --prod --token "$VERCEL_TOKEN" --yes
fi
