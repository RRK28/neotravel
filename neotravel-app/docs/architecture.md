# Architecture NeoTravel — parcours Option A / Option B

## Vue d'ensemble

NeoTravel propose **deux entrées utilisateur** qui convergent vers le **même pipeline métier** :

| Parcours | Route | Rôle |
|----------|-------|------|
| **Option A** (principal) | `/chat` | Assistant conversationnel — collecte le besoin en langage naturel |
| **Option B** (alternatif) | `/devis` | Formulaire guidé en 3 étapes |

Les deux appellent le moteur `calculer_devis` (TypeScript déterministe). **Le LLM ne calcule jamais le prix.**

## Flux Option A (chat IA)

```mermaid
flowchart TB
  Prospect["Prospect"] --> Chat["/chat — ChatLive"]
  Chat --> LLM["LLM (Ollama / OpenAI)"]
  LLM --> Pipeline["processDemandePipeline"]
  Pipeline --> Q["qualifier"]
  Q --> C["calculer_devis"]
  C --> G["generer_devis + email PDF"]
  G --> Store["Store JSON / Airtable"]
  Store --> Admin["/admin"]
  Store --> Relances["Relances planifiées"]
```

## Flux Option B (formulaire)

```mermaid
flowchart TB
  Prospect["Prospect"] --> Devis["/devis — DevisWizard"]
  Devis --> Wizard["processWizardDemande"]
  Wizard --> C["calculer_devis"]
  C --> G["PDF + email + admin"]
```

## Orchestration n8n (API tools)

n8n **orchestre** la même chaîne métier que l'agent, via des routes REST authentifiées (`x-webhook-secret`) :

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

Workflow exporté : `n8n/workflows/neotravel-orchestration.json` (démo jury + relances planifiées).

| Route | Rôle |
|-------|------|
| `GET /api/n8n/status` | Santé + relances en attente |
| `POST /api/n8n/qualifier` | Parse / crée demande, retourne score |
| `POST /api/n8n/calculer-devis` | Moteur tarifaire déterministe |
| `POST /api/n8n/generer-devis` | Devis + PDF + email |
| `POST /api/n8n/relance` | Alias `/api/webhooks/relance` |

## Fournisseurs LLM

| Environnement | Configuration | Fournisseur |
|---------------|---------------|-------------|
| Local dev | `LLM_PROVIDER=ollama` + Ollama démarré | Ollama |
| Vercel prod | `LLM_PROVIDER=openai` + `OPENAI_API_KEY` | OpenAI |
| Secours | Aucun LLM / `DEMO_MODE=true` | `/api/chat/demo` (pipeline sans modèle) |

Badge « Propulsé par IA » affiché sur la landing lorsqu'Ollama ou OpenAI est disponible.

## Règle d'or

Le system prompt et les tools de l'agent délèguent toute décision tarifaire à `calculer_devis()`. Voir `docs/note-de-cadrage.md` (section 8).
