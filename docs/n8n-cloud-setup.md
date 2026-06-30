# Configuration n8n Cloud — NeoTravel (Vercel)

Ce guide configure l'**orchestration complète** NeoTravel via [n8n Cloud](https://app.n8n.cloud/) : qualification, devis, génération PDF/email et relances automatiques.

> **Important :** n8n Cloud et NeoTravel sont **deux services distincts**.
> - NeoTravel (site, chat, admin) : `https://neotravel-app-gamma.vercel.app`
> - n8n (orchestration) : `https://app.n8n.cloud`
>
> n8n **n'apparaît pas** dans l'interface Vercel : l'intégration se fait par des appels HTTP vers `/api/n8n/*`.

> **Persistance Airtable :** n8n **n'appelle pas Airtable directement**. Les données passent par l'API NeoTravel (`/api/n8n/*`), qui persiste dans Airtable lorsque `AIRTABLE_API_KEY` et `AIRTABLE_BASE_ID` sont configurés sur Vercel. Aucun nœud Airtable n'est requis dans n8n pour le MVP.

---

## Architecture

```
┌─────────────────────┐   GET /api/n8n/status                     ┌──────────────────────────┐
│  n8n Cloud          │   POST /api/n8n/qualifier                 │  NeoTravel (Vercel)      │
│  app.n8n.cloud      │   POST /api/n8n/calculer-devis            │  neotravel-app-gamma…    │
│                     │   POST /api/n8n/generer-devis             │                          │
│  ▶ Démo jury        │   POST /api/n8n/relance                   │  → tools métier          │
│  Schedule (15 min)  │     header x-webhook-secret               │  → emails + relances     │
└─────────────────────┘                                         └──────────────────────────┘
```

Le workflow **`neotravel-orchestration.json`** enchaîne visuellement qualifier → calculer → generer → relance pour la démo jury.

---

## Prérequis

| Élément | Où le trouver |
|---------|---------------|
| URL production NeoTravel | `https://neotravel-app-gamma.vercel.app` |
| API n8n (base) | `https://neotravel-app-gamma.vercel.app/api/n8n` |
| Secret webhook | Même valeur que `WEBHOOK_SECRET` dans les variables d'environnement **Vercel** |
| Fichier workflow | `n8n/workflows/neotravel-orchestration.json` (recommandé) ou `relance-neotravel.json` |

Vérifier que `WEBHOOK_SECRET` est bien défini sur Vercel : **Project → Settings → Environment Variables**.

---

## Endpoints API n8n

| Méthode | Route | Body | Réponse |
|---------|-------|------|---------|
| GET | `/api/n8n/status` | — | `{ ok, pending_relances, ... }` |
| POST | `/api/n8n/qualifier` | `{ text }` ou champs demande | `{ demande_id, missing, score, pret_pour_devis }` |
| POST | `/api/n8n/calculer-devis` | `{ demande_id }` | `{ prix_ttc, prix_ht, ... }` |
| POST | `/api/n8n/generer-devis` | `{ demande_id }` | `{ devis_id, pdf_url, email_sent }` |
| POST | `/api/n8n/relance` | `{}` | `{ ok, traitees, results }` |

Toutes les routes POST exigent le header `x-webhook-secret` (sauf GET status).

---

## Étape 1 — Créer un compte n8n Cloud

1. Ouvrir [https://app.n8n.cloud/](https://app.n8n.cloud/)
2. Cliquer sur **Get started** / **Sign up**
3. Créer un compte (email ou SSO)
4. Choisir un nom d'instance (ex. `neotravel-demo`)
5. Une fois connecté, vous arrivez sur le **tableau de bord n8n**

---

## Étape 2 — Importer (ou ré-importer) le workflow

1. Dans n8n Cloud, menu **Workflows**
2. Si une ancienne version existe : ouvrir le workflow → **⋯** → **Delete** (ou le remplacer)
3. **Add workflow** → **Import from file**
4. Sélectionner `n8n/workflows/neotravel-orchestration.json` depuis ce dépôt Git
5. Le workflow **« NeoTravel — Orchestration complète »** s'ouvre avec la chaîne :

| Nœud | Rôle |
|------|------|
| **Architecture Option A** (sticky) | Schéma Option A + consignes |
| **▶ Démo jury** | Chaîne complète qualifier → devis → relance |
| **Toutes les 15 min** | Cron relances seules |
| **Config NeoTravel** | URL + secret (à compléter) |
| **GET status** | Santé + relances en attente |
| **POST qualifier** | Exemple Paris → Lyon |
| **POST calculer-devis** / **POST generer-devis** | Moteur + PDF/email |
| **POST relance** | Relances dues |
| **Résumé orchestration** | JSON récapitulatif |

> Ancien workflow relances seules : `relance-neotravel.json` (toujours valide).

Les URLs Vercel sont **codées en dur** dans les nœuds HTTP.

---

## Étape 3 — Coller le WEBHOOK_SECRET

> **Obligatoire avant activation.** Sans secret valide, le POST renvoie `401 Non autorisé`.

1. Double-cliquer sur le nœud **Config NeoTravel**
2. Remplacer `COLLER_WEBHOOK_SECRET_ICI` par la valeur de `WEBHOOK_SECRET` (Vercel)
3. Vérifier : `app_url`, `api_base` déjà renseignés
4. **Save** le workflow

Ne **jamais** committer le secret dans Git.

---

## Étape 4 — Activer le workflow

1. Toggle **Inactive → Active**
2. Le cron s'exécute **toutes les 15 minutes** (relances seules)
3. **Test démo jury** : **▶ Démo jury** → **Executions** → **Résumé orchestration**

Exemple résumé démo :

```json
{
  "execution_summary": {
    "mode": "demo_jury",
    "qualifier": { "pret_pour_devis": true, "score": 100 },
    "calcul": { "prix_ttc": 1520.21 },
    "devis": { "devis_id": "...", "email_sent": true },
    "relances": { "ok": true, "traitees": 0 }
  }
}
```

---

## Étape 5 — Vérifier la connexion Vercel

### Test curl qualifier

```bash
curl -X POST https://neotravel-app-gamma.vercel.app/api/n8n/qualifier \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: VOTRE_SECRET" \
  -d '{"text":"Devis 35 personnes Paris à Lyon le 15/07/2026, email demo@neotravel.test"}'
```

### Test curl relance

```bash
curl -X POST https://neotravel-app-gamma.vercel.app/api/n8n/relance \
  -H "x-webhook-secret: VOTRE_SECRET" \
  -H "x-app-base-url: https://neotravel-app-gamma.vercel.app"
```

---

## Démo jury — scénario recommandé (2 min)

| Onglet | URL | Ce qu'on montre |
|--------|-----|-----------------|
| A — NeoTravel | `/admin` | Demandes créées par n8n |
| B — n8n Cloud | workflow orchestration | Chaîne API tools |

### Script oral

1. « n8n **orchestre** les mêmes tools que le chat Option A : qualifier, calculer, generer, relance. »
2. Montrer **▶ Démo jury** → chaîne HTTP sur le canvas
3. Exécution live → **Résumé orchestration**
4. Retour `/admin` : nouvelle demande + devis

---

## Dépannage

| Symptôme | Cause probable | Action |
|----------|----------------|--------|
| 401 Non autorisé | Secret différent | Aligner n8n et `WEBHOOK_SECRET` Vercel |
| Workflow inactif | Toggle désactivé | Activer le workflow |
| Demande incomplète | Payload qualifier | Vérifier le nœud POST qualifier |
| Secret non configuré | Placeholder | Coller secret dans **Config NeoTravel** |

---

## Références

- Workflow orchestration : [`n8n/workflows/neotravel-orchestration.json`](../n8n/workflows/neotravel-orchestration.json)
- API n8n : `neotravel-app/src/app/api/n8n/`
- Script démo : [`docs/demo-soutenance.md`](demo-soutenance.md)
