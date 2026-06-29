# Déploiement NeoTravel sur Vercel

Alternative ou complément au tunnel Cloudflare : URL HTTPS publique gérée par Vercel.

## Prérequis

- Compte [Vercel](https://vercel.com)
- Token API : [Account → Tokens](https://vercel.com/account/tokens)
- Ajouter dans `neotravel-app/.env` (fichier ignoré par git) :

```bash
VERCEL_TOKEN=vercel_votre_token
VERCEL_SCOPE=slug-de-votre-equipe  # ex. grp-16 si le CLI le demande
```

## Déployer

Depuis `neotravel-app/` :

```bash
chmod +x scripts/deploy-vercel.sh
./scripts/deploy-vercel.sh
```

Ou :

```bash
npm run deploy:vercel
```

Le script charge `VERCEL_TOKEN` et optionnellement `VERCEL_SCOPE` depuis `.env`, lance `npx vercel deploy --prod` et affiche l’URL de production.

Premier déploiement : le CLI peut demander de lier le projet (équipe, nom). Répondez dans le terminal ou liez via le dashboard Vercel.

## Variables d’environnement (dashboard Vercel)

| Variable | Obligatoire | Notes |
|----------|-------------|--------|
| `APP_BASE_URL` | Oui | URL publique du site, ex. `https://neotravel-xxx.vercel.app` (liens dans les e-mails) |
| `LLM_PROVIDER` | **Option A prod** | `openai` sur Vercel |
| `OPENAI_API_KEY` | **Option A prod** | Requis pour le chat IA en production |
| `OPENAI_MODEL` | Non | Défaut : `gpt-4o-mini` |
| `DEMO_MODE` | Secours | `true` pour forcer le mode sans LLM (`/api/chat/demo`) si pas de clé OpenAI |
| `SMTP_HOST` | Pour e-mails réels | ex. `smtp-relay.brevo.com` |
| `SMTP_PORT` | Pour e-mails réels | ex. `587` |
| `SMTP_USER` | Pour e-mails réels | Identifiant SMTP Brevo/Gmail |
| `SMTP_PASS` | Pour e-mails réels | Clé / mot de passe SMTP |
| `EMAIL_FROM` | Pour e-mails réels | ex. `NeoTravel <contact@domaine.com>` |
| `SMTP_SECURE` | Non | `true` si port 465 |
| `WEBHOOK_SECRET` | Recommandé | Secret pour `/api/webhooks/relance` |
| `RESEND_API_KEY` | Optionnel | Alternative à SMTP |

**Configuration recommandée pour la soutenance (Option A)** :

```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
APP_BASE_URL=https://votre-projet.vercel.app
WEBHOOK_SECRET=...
```

**Ne pas** définir sur Vercel :

- `VERCEL_TOKEN` (réservé au CLI local)
- `OLLAMA_BASE_URL` / `OLLAMA_MODEL` (Ollama tourne en local, inaccessible depuis les fonctions serverless)

Sans SMTP ni Resend, les e-mails sont simulés en console (comportement dev).

## Limitations en production Vercel

1. **Stockage fichier** : les demandes/devis/admin utilisent `.data/store.json`. Sur Vercel (serverless), le disque est **éphémère** : les données ne persistent pas entre invocations ni entre déploiements. Pour un admin fiable en ligne, garder l’admin en local/tunnel ou migrer vers Airtable (voir `docs/airtable-setup.md`).
2. **Ollama** : le LLM local ne fonctionne pas sur Vercel. Utiliser `OPENAI_API_KEY` + `LLM_PROVIDER=openai` pour l’Option A, ou `DEMO_MODE=true` en secours.
3. **Relances planifiées** : pas de cron intégré dans ce repo ; déclencher les relances via n8n Cloud ou manuellement depuis l’admin.

## Parcours utilisateur

- **Option A (principal)** : `/chat` — assistant IA avec OpenAI en prod
- **Option B (alternatif)** : `/devis` — formulaire guidé sans LLM

Voir `docs/architecture.md`.

## Fichiers du repo

- `.vercelignore` — exclut `.env` et `.data/` des uploads CLI
- `vercel.json` — build Next.js
- `scripts/deploy-vercel.sh` — déploiement avec token depuis `.env`
