# Architecture NeoTravel

> **Documentation complète :** [`docs/mode-emploi.md`](../../docs/mode-emploi.md) — schémas, API, n8n, déploiement, FAQ soutenance.

## Nomenclature Option A / B

| Sens | Option A | Option B |
|------|----------|----------|
| **Parcours utilisateur** | `/chat` — assistant IA (principal) | `/devis` — formulaire guidé (alternatif) |
| **Architecture technique (fiche PDF)** | n8n comme cerveau (non retenu) | **Vercel AI SDK** dans Next.js (implémenté) |

## Vue d'ensemble

Deux entrées utilisateur → **un seul pipeline métier** → store JSON → admin + relances n8n.

```mermaid
graph TB
  subgraph Frontend["Next.js / Vercel"]
    CHAT["/chat — Option A"]
    DEVIS["/devis — Option B"]
    ADMIN["/admin"]
  end

  subgraph Agent["Vercel AI SDK"]
    LLM["LLM"] --> TOOLS["6 tools"]
  end

  subgraph Metier["TypeScript"]
    CALC["calculer_devis ★"]
  end

  subgraph Back["Back-office"]
    N8N["n8n Cloud"]
    API["/api/n8n/*"]
  end

  CHAT --> LLM
  DEVIS --> TOOLS
  TOOLS --> CALC
  N8N --> API --> CALC
  CALC --> STORE["memory-store"]
  STORE --> ADMIN
```

## Flux Option A (chat)

```mermaid
flowchart TB
  Prospect --> Chat["/chat — ChatLive"]
  Chat --> LLM["LLM Ollama / OpenAI"]
  LLM --> Pipeline["processDemandePipeline / tools"]
  Pipeline --> Q["qualifier"]
  Q --> C["calculer_devis"]
  C --> G["generer_devis + email PDF"]
  G --> Store["Store JSON"]
  Store --> Admin["/admin"]
  Store --> Relances["Relances planifiées"]
```

## Flux Option B (formulaire)

```mermaid
flowchart TB
  Prospect --> Devis["/devis — DevisWizard"]
  Devis --> Wizard["processWizardDemande"]
  Wizard --> C["calculer_devis"]
  C --> G["PDF + email + admin"]
```

## Orchestration n8n

n8n orchestre la même chaîne via REST (`x-webhook-secret`) :

```mermaid
flowchart LR
  n8n["n8n Cloud / Docker"]
  n8n --> Status["GET /api/n8n/status"]
  n8n --> Qual["POST /api/n8n/qualifier"]
  Qual --> Calc["POST /api/n8n/calculer-devis"]
  Calc --> Gen["POST /api/n8n/generer-devis"]
  Gen --> Rel["POST /api/n8n/relance"]
  Qual --> Store["memory-store"]
  Calc --> Store
  Gen --> Store
  Rel --> Store
```

Workflow : `n8n/workflows/neotravel-orchestration.json`

| Route | Rôle |
|-------|------|
| `GET /api/n8n/status` | Santé + relances en attente |
| `POST /api/n8n/qualifier` | Parse / crée demande |
| `POST /api/n8n/calculer-devis` | Moteur tarifaire déterministe |
| `POST /api/n8n/generer-devis` | Devis + PDF + email |
| `POST /api/n8n/relance` | Traite relances dues |

## Fournisseurs LLM

| Environnement | Configuration | Fournisseur |
|---------------|---------------|-------------|
| Local dev | `LLM_PROVIDER=ollama` | Ollama |
| Vercel prod | `LLM_PROVIDER=openai` + clé API | OpenAI |
| Secours | `DEMO_MODE=true` ou `/chat?demo=1` | Pipeline sans LLM |

## Règle d'or

Le LLM **ne calcule jamais le prix**. Seul `calculerDevis()` dans `src/lib/pricing/calculer-devis.ts` produit un montant. Voir [`docs/mode-emploi.md`](../../docs/mode-emploi.md#5-moteur-tarifaire).
