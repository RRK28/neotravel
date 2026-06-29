# Chat conversationnel local avec Ollama

Guide pour utiliser un LLM **sur votre PC** avec NeoTravel (développement local uniquement — Ollama n'est pas accessible depuis Vercel).

## Prérequis

1. **Installer Ollama** : [https://ollama.com](https://ollama.com)
2. **Télécharger un modèle** (au choix) :

```bash
ollama pull llama3.2
# ou
ollama pull mistral
```

3. **Démarrer le serveur** (souvent automatique après installation) :

```bash
ollama serve
```

Vérification : `curl http://127.0.0.1:11434/api/tags` doit lister vos modèles.

## Configuration NeoTravel

Dans `neotravel-app/.env` :

```env
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2
OLLAMA_MAX_TOKENS=512
```

| Variable | Description |
|----------|-------------|
| `LLM_PROVIDER` | `ollama` pour forcer le LLM local |
| `OLLAMA_BASE_URL` | URL du serveur Ollama (défaut `http://127.0.0.1:11434`) |
| `OLLAMA_MODEL` | Nom du modèle pullé (`llama3.2`, `mistral`, etc.) |
| `OLLAMA_MAX_TOKENS` | Limite de tokens en sortie (défaut `512`) — contrôle la longueur des réponses |

Sans `LLM_PROVIDER`, l'app tente Ollama en auto si joignable, sinon OpenAI si clé présente, sinon mode démo (`/api/chat/demo`).

## Lancer l'app

```bash
cd neotravel-app
npm install
npm run dev
```

Ouvrir [http://localhost:3000/chat](http://localhost:3000/chat).

## Comportement attendu

- Le **system prompt** limite l'assistant au transport autocar NeoTravel (devis, trajets, champs manquants).
- Les **prix et distances** sont calculés côté serveur (`processDemandePipeline`) — le LLM reformule uniquement.
- Les questions **hors sujet** sont refusées poliment et redirigées vers un devis autocar.
- Température `0` et `OLLAMA_MAX_TOKENS` limitent les réponses longues ou hors périmètre.

## Dépannage

| Problème | Solution |
|----------|----------|
| `503 Aucun LLM disponible` | `ollama serve` + vérifier `OLLAMA_BASE_URL` |
| Modèle introuvable | `ollama pull llama3.2` ou définir `OLLAMA_MODEL` |
| Réponses trop longues | Baisser `OLLAMA_MAX_TOKENS` (ex. `384`) |
| Pas de LLM en prod Vercel | Normal — utiliser `LLM_PROVIDER=openai` sur Vercel |

## Production Vercel

Ollama tourne en local et **ne peut pas** être appelé depuis les fonctions serverless Vercel. En production, configurez `LLM_PROVIDER=openai` + `OPENAI_API_KEY`, ou `DEMO_MODE=true` pour le chat sans LLM.

Voir aussi [README.md](README.md) et [DEPLOY-VERCEL.md](DEPLOY-VERCEL.md).
