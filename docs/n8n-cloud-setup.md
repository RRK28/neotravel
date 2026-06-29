# Configuration n8n Cloud — NeoTravel (Vercel)

Ce guide configure l'**orchestration complète** NeoTravel via [n8n Cloud](https://app.n8n.cloud/) : qualification, devis, génération PDF/email et relances automatiques.

> **Important :** n8n Cloud et NeoTravel sont **deux services distincts**.
> - NeoTravel (site, chat, admin) : `https://neotravel-app-gamma.vercel.app`
> - n8n (orchestration) : `https://app.n8n.cloud`
>
> n8n **n'apparaît pas** dans l'interface Vercel : l'intégration se fait par des appels HTTP vers `/api/n8n/*`.

> **Persistance Airtable :** n8n **n'appelle pas Airtable directement**. Les données passent par l'API NeoTravel (`/api/n8n/*`), qui persiste dans **Airtable en production** lorsque `AIRTABLE_API_KEY` et `AIRTABLE_BASE_ID` sont configurés sur Vercel. Aucun nœud Airtable n'est requis dans n8n.

---

## Architecture

```
┌─────────────────────┐   GET  /api/n8n/status                      ┌──────────────────────────┐
│  n8n Cloud          │   POST /api/n8n/qualifier                 │  NeoTravel (Vercel)      │
│  app.n8n.cloud      │   POST /api/n8n/calculer-devis            │  neotravel-app-gamma…    │
│                     │   POST /api/n8n/generer-devis             │                          │
│  ▶ Démo jury        │   POST /api/n8n/relance                   │  → tools métier          │
│  Schedule (15 min)  │     header x-webhook-secret               │  → Airtable (prod)       │
└─────────────────────┘                                         └──────────────────────────┘
```

Le workflow **`neotravel-orchestration.json`** enchaîne qualifier → calculer → generer → relance pour la démo jury. Le workflow **`relance-neotravel.json`** est une variante légère (relances seules, même API).

---

## Comportement relances (aligné app)

| Règle | Détail |
|-------|--------|
| Quand planifiées | **Après** `generer-devis` complet (email client envoyé) |
| Jamais sur | Relances devis (`pret_pour_devis: false`) |
| Email incomplet | Après `qualifier` si email présent + champs manquants (1× par liste, anti-spam) |
| Destinataire | Email **client** uniquement |
| Échéances | J+2 / J+7 (prod) ou +2 / +7 min si `DEMO_MODE=true` |
| Traitement n8n | POST `/api/n8n/relance` n'envoie que les relances **échues** |
| Annulation auto | `annulerRelancesDemande` si statut → accepte / refuse / cloture |
| Admin `/admin` | Boutons **accepter**, **refuser**, **clôturer**, **rouvrir** |

Juste après une démo `generer-devis`, `traitees: 0` dans le résumé est **normal** : les relances sont planifiées pour plus tard (cron 15 min ou délai démo).

---

## Prérequis

| Élément | Où le trouver |
|---------|---------------|
| URL production NeoTravel | `https://neotravel-app-gamma.vercel.app` |
| API n8n (base) | `https://neotravel-app-gamma.vercel.app/api/n8n` |
| Secret webhook | Variable `WEBHOOK_SECRET` sur Vercel (ex. dev : `neotravel-dev-secret`) |
| Fichier workflow | `n8n/workflows/neotravel-orchestration.json` (recommandé) ou `relance-neotravel.json` |

Vérifier que `WEBHOOK_SECRET` est bien défini sur Vercel : **Project → Settings → Environment Variables**.

> **Ne pas utiliser** `VERCEL_TOKEN` (`vcp_…`) : c'est un token de déploiement CLI, pas le secret webhook.

---

## Endpoints API n8n

| Méthode | Route | Body | Réponse |
|---------|-------|------|---------|
| GET | `/api/n8n/status` | — | `{ ok, storage_backend, pending_relances, ... }` |
| POST | `/api/n8n/qualifier` | `{ text }` ou champs demande | `{ demande_id, missing, pret_pour_devis, email_incomplet_envoye? }` |
| POST | `/api/n8n/notifier-incomplet` | `{ demande_id }` | `{ email_envoye, champs_manquants }` (optionnel si qualifier déjà appelé) |
| POST | `/api/n8n/calculer-devis` | `{ demande_id }` | `{ prix_ttc, prix_ht, ... }` |
| POST | `/api/n8n/generer-devis` | `{ demande_id }` | `{ devis_id, pdf_url, email_sent }` + relances planifiées |
| POST | `/api/n8n/relance` | `{}` | `{ ok, traitees, results }` |

Toutes les routes POST exigent le header `x-webhook-secret` (sauf GET status). Alias legacy : `/api/webhooks/relance` (même logique que `/api/n8n/relance`).

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
| **Architecture NeoTravel** (sticky) | Schéma + règles relances / admin |
| **▶ Démo jury** | Chaîne complète qualifier → devis → relance (échues) |
| **Toutes les 15 min** | Cron relances seules |
| **Config NeoTravel** | `app_url`, `api_base`, `webhook_secret` (à compléter) |
| **GET status** | Santé + `storage_backend` + relances en attente |
| **POST qualifier** | Exemple Paris → Lyon |
| **Demande complète?** | Branche si `pret_pour_devis` |
| **Demande incomplète** | Résumé + email client (lien `/devis` prérempli) si email présent |
| **POST calculer-devis** / **POST generer-devis** | Moteur + PDF/email + planification relances |
| **POST relance** | Relances échues uniquement |
| **Résumé orchestration** | JSON récapitulatif |

> Variante relances seules : `relance-neotravel.json` (GET status → POST relance, mêmes règles).

Les URLs utilisent les champs `api_base` / `app_url` du nœud **Config NeoTravel**.

---

## Étape 3 — Coller le WEBHOOK_SECRET

> **Obligatoire avant activation.** Sans secret valide, le POST renvoie `401 Non autorisé`.

1. Double-cliquer sur le nœud **Config NeoTravel**
2. Remplacer `COLLER_WEBHOOK_SECRET_ICI` par la valeur de `WEBHOOK_SECRET` (Vercel → Environment Variables)
   - En local / démo : souvent `neotravel-dev-secret` (voir `neotravel-app/.env.example`)
3. Vérifier : `app_url` et `api_base` déjà renseignés
4. **Save** le workflow

> **Attention** : ne pas coller `VERCEL_TOKEN` (`vcp_…`) — seule la variable **`WEBHOOK_SECRET`** fonctionne dans le champ `webhook_secret`.

Ne **jamais** committer le secret dans Git.

---

## Étape 4 — Activer le workflow

1. Toggle **Inactive → Active**
2. Le cron s'exécute **toutes les 15 minutes** (relances échues seules)
3. **Test démo jury** : **▶ Démo jury** → **Executions** → **Résumé orchestration**

Exemple résumé démo (juste après generer) :

```json
{
  "execution_summary": {
    "mode": "demo_jury",
    "storage_backend": "airtable",
    "qualifier": { "pret_pour_devis": true, "score": 100 },
    "calcul": { "prix_ttc": 1520.21 },
    "devis": {
      "devis_id": "...",
      "email_sent": true,
      "relances_planifiees": "2 relances client planifiées (échéance future)"
    },
    "relances": {
      "ok": true,
      "traitees": 0,
      "note": "Normal juste après generer-devis : relances pas encore échues"
    }
  }
}
```

Pour voir `traitees > 0` en démo : activer `DEMO_MODE=true` sur Vercel, attendre +2 min, relancer le cron ou **▶ Démo soutenance** sur `relance-neotravel.json`.

---

## Étape 5 — Vérifier la connexion Vercel

### Test curl status

```bash
curl https://neotravel-app-gamma.vercel.app/api/n8n/status
```

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
| A — NeoTravel | `/admin` | Demandes/devis (Airtable), boutons accepter/refuser/clôturer |
| B — n8n Cloud | workflow orchestration | Chaîne API `/api/n8n/*` |

### Script oral

1. « n8n **orchestre** les mêmes endpoints que le chat : qualifier, calculer, generer, relance. »
2. Montrer **▶ Démo jury** → chaîne HTTP sur le canvas
3. Exécution live → **Résumé orchestration** (`traitees: 0` normal immédiatement après generer)
4. Retour `/admin` : nouvelle demande + devis ; relances planifiées visibles
5. Option : clôturer la demande → relances annulées (`annulerRelancesDemande`)

---

## Dépannage

| Symptôme | Cause probable | Action |
|----------|----------------|--------|
| 401 Non autorisé | Secret différent ou `VERCEL_TOKEN` à la place de `WEBHOOK_SECRET` | Coller `WEBHOOK_SECRET` (ex. `neotravel-dev-secret`) dans **Config NeoTravel** |
| Workflow inactif | Toggle désactivé | Activer le workflow |
| Demande incomplète | Payload qualifier | Vérifier le nœud POST qualifier ; pas de relance sur cette branche |
| `traitees: 0` après démo | Relances planifiées, pas encore échues | Normal ; attendre cron ou `DEMO_MODE` + délai |
| Secret non configuré | Placeholder | Coller secret dans **Config NeoTravel** |
| Relances non annulées | Statut admin non final | accepte / refuse / cloture déclenchent l'annulation |

---

## Références

- Workflow orchestration : [`n8n/workflows/neotravel-orchestration.json`](../n8n/workflows/neotravel-orchestration.json)
- Workflow relances seules : [`n8n/workflows/relance-neotravel.json`](../n8n/workflows/relance-neotravel.json)
- API n8n : `neotravel-app/src/app/api/n8n/`
- Script démo : [`docs/demo-soutenance.md`](demo-soutenance.md)
