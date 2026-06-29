# Procédure de reprise — NeoTravel

Document pour un développeur ou une équipe reprenant le projet après la soutenance (rubrique L3 — Passation).

---

## 1. Prérequis

| Outil | Version min. | Usage |
|-------|--------------|-------|
| Node.js | 20+ | App Next.js |
| npm | 10+ | Dépendances |
| Docker | récent | n8n local |
| cloudflared | optionnel | Tunnel public n8n / app |
| Ollama | optionnel | LLM local (`llama3.2`) |

---

## 2. Cloner et installer

```bash
git clone <url-repo> Neotravel
cd Neotravel/neotravel-app
cp .env.example .env
npm install
```

Éditer `.env` — voir section 3 du README `neotravel-app/README.md`.

---

## 3. Lancer en local

```bash
# Terminal 1 — application
cd neotravel-app
npm run dev
# → http://localhost:3000

# Terminal 2 — n8n (depuis la racine du repo)
cd ..
docker compose up -d n8n
# → http://localhost:5678

# Terminal 3 — tunnel n8n public (soutenance)
./scripts/n8n-online.sh
```

---

## 4. Importer le workflow n8n

1. Ouvrir n8n → **Workflows** → **Import from file**
2. Sélectionner `n8n/workflows/relance-neotravel.json`
3. Configurer les variables d'environnement n8n :
   - `NEOTRAVEL_WEBHOOK_URL` = `http://host.docker.internal:3000/api/webhooks/relance` (Mac/Win Docker)
   - `NEOTRAVEL_WEBHOOK_SECRET` = même valeur que `WEBHOOK_SECRET` dans `.env`
   - `NEOTRAVEL_APP_URL` = `http://localhost:3000` ou URL tunnel/Vercel
4. Activer le workflow

---

## 5. Structure du code (points d'entrée)

| Chemin | Description |
|--------|-------------|
| `neotravel-app/src/app/chat/` | Interface chat |
| `neotravel-app/src/app/admin/` | Dashboard commercial |
| `neotravel-app/src/lib/demande-ingest.ts` | Pipeline serveur (pricing) |
| `neotravel-app/src/lib/pricing/calculer-devis.ts` | Moteur tarifaire |
| `neotravel-app/src/lib/agent/` | System prompt + tools LLM |
| `neotravel-app/src/app/api/webhooks/relance/` | Webhook relances |
| `docs/` | Cadrage, fiabilité, démo |

---

## 6. Tests avant mise en prod

```bash
cd neotravel-app
npm run test:unit
npm run build
npm run test:e2e   # nécessite `npm run dev` ou webServer Playwright
```

---

## 7. Déploiement Vercel

Voir `neotravel-app/docs/DEPLOY-VERCEL.md`. Variables obligatoires : `APP_BASE_URL`, `WEBHOOK_SECRET`, `DEMO_MODE` ou `OPENAI_API_KEY`, SMTP si emails réels.

---

## 8. Données et persistance

- Store JSON : `neotravel-app/.data/store.json` (créé au premier run)
- **Attention Vercel :** filesystem éphémère — les données ne survivent pas entre invocations serverless ; OK pour démo, pas pour prod.

---

## 9. Contacts équipe origine

Voir `docs/equipe.md` — Groupe 16, Epitech 230.

---

## 10. Dépannage rapide

| Problème | Solution |
|----------|----------|
| Chat 503 LLM | Démarrer Ollama ou passer `OPENAI_API_KEY` ; ou utiliser `/chat?demo=1` |
| Email non envoyé | Configurer `SMTP_*` dans `.env` ; sinon mode simulé (console) |
| Webhook 401 | Aligner `x-webhook-secret` et `WEBHOOK_SECRET` |
| Docker sans espace | `docker system prune` ou libérer disque |
| Prix incohérent | Vérifier que le changement est dans `calculer-devis.ts`, pas le prompt |
