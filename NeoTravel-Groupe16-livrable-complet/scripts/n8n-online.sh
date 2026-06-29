#!/usr/bin/env bash
# Démarre n8n (Docker) + tunnel Cloudflare pour accès public.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

LOG="$ROOT/.n8n-tunnel.log"
PIDFILE="$ROOT/.n8n-tunnel.pid"

echo "→ Démarrage n8n (Docker)…"
docker compose up -d n8n

if ! curl -sf -o /dev/null "http://localhost:5678" 2>/dev/null; then
  echo "   Attente n8n sur :5678…"
  for _ in $(seq 1 30); do
    sleep 2
    curl -sf -o /dev/null "http://localhost:5678" 2>/dev/null && break
  done
fi

if [ -f "$PIDFILE" ]; then
  old_pid=$(cat "$PIDFILE")
  kill "$old_pid" 2>/dev/null || true
fi
pkill -f 'cloudflared tunnel --url http://localhost:5678' 2>/dev/null || true

echo "→ Tunnel Cloudflare vers n8n…"
: > "$LOG"
cloudflared tunnel --url http://localhost:5678 2>&1 | tee -a "$LOG" &
echo $! > "$PIDFILE"

URL=""
for _ in $(seq 1 20); do
  URL=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$LOG" | head -1 || true)
  [ -n "$URL" ] && break
  sleep 1
done

if [ -z "$URL" ]; then
  echo "✗ URL tunnel introuvable. Voir $LOG"
  exit 1
fi

HOST="${URL#https://}"
cat > .env.n8n <<EOF
N8N_PUBLIC_HOST=$HOST
N8N_PUBLIC_PROTOCOL=https
N8N_WEBHOOK_URL=${URL}/
N8N_EDITOR_BASE_URL=${URL}/
N8N_SECURE_COOKIE=true
EOF

echo "→ Redémarrage n8n avec l'URL publique…"
docker compose --env-file .env.n8n up -d --force-recreate n8n

sleep 3
HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$URL" 2>/dev/null || echo "000")

echo ""
echo "════════════════════════════════════════"
echo "  n8n local  : http://localhost:5678"
echo "  n8n public : $URL"
echo "  HTTP check : $HTTP"
echo "════════════════════════════════════════"
echo ""
echo "Webhook NeoTravel (relances) :"
echo "  POST ${NEOTRAVEL_APP_URL:-http://localhost:3000}/api/webhooks/relance"
echo "  Header: x-webhook-secret: (valeur WEBHOOK_SECRET du .env)"
echo ""
echo "Garde ce terminal ouvert (tunnel actif)."
echo "Arrêt: kill \$(cat .n8n-tunnel.pid) && docker compose stop n8n"
