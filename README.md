# NeoTravel

Prototype **Interstellabs** — automatisation devis transport autocar (Epitech 230, Groupe 16).

L'application Next.js est dans [`neotravel-app/`](neotravel-app/). La documentation projet est dans [`docs/`](docs/).

## Démarrage rapide

```bash
cd neotravel-app
cp .env.example .env
npm install
npm run dev
```

→ http://localhost:3000 — Chat : `/chat` — Admin : `/admin`

## Documentation clé

| Document | Contenu |
|----------|---------|
| [neotravel-app/README.md](neotravel-app/README.md) | Lancement, variables d'env, architecture |
| [docs/note-de-cadrage.md](docs/note-de-cadrage.md) | Cadrage métier |
| [docs/fiabilite.md](docs/fiabilite.md) | HITL, RGPD, pricing déterministe |
| [docs/cas-de-test.md](docs/cas-de-test.md) | Golden tests + E2E |
| [docs/demo-soutenance.md](docs/demo-soutenance.md) | Script démo jury |
| [docs/passation-reprise.md](docs/passation-reprise.md) | Reprise technique |
| [docs/passation-neotravel.md](docs/passation-neotravel.md) | Usage quotidien équipes |
| [docs/equipe.md](docs/equipe.md) | Rôles Groupe 16 |
| [docs/decision-log.md](docs/decision-log.md) | Journal de décisions |
| [docs/backlog.md](docs/backlog.md) | Backlog Agile |
| [docs/retro.md](docs/retro.md) | Rétrospective |

## n8n (relances)

**Production (recommandé) :** [n8n Cloud](https://app.n8n.cloud/) — voir [`docs/n8n-cloud-setup.md`](docs/n8n-cloud-setup.md).

**Local (secours) :**

```bash
docker compose up -d n8n          # http://localhost:5678
./scripts/n8n-online.sh           # tunnel Cloudflare (optionnel)
```

Workflow exporté : [`n8n/workflows/relance-neotravel.json`](n8n/workflows/relance-neotravel.json)

## Tests

```bash
cd neotravel-app
npm run test:unit    # Vitest — calculerDevis
npm run test:e2e     # Playwright
npm run build
```
