# Configuration Airtable pour NeoTravel

NeoTravel peut persister les demandes, devis, relances et logs dans **Airtable** au lieu du fichier local `.data/store.json` (éphémère sur Vercel).

Sans `AIRTABLE_API_KEY` **et** `AIRTABLE_BASE_ID`, l'application utilise le **stockage fichier** (`storage_backend: "file"` sur `/api/n8n/status`).

---

## Checklist rapide (base **NeoTravelBDD**)

> La table par défaut **Table 1** (colonnes *Name*, *Notes*) **n'est pas** le schéma NeoTravel. Ne la renommez pas en « Demandes » : créez de **nouvelles** tables ou supprimez Table 1.

| Étape | Action dans l'interface Airtable |
|-------|----------------------------------|
| **1** | Ouvrez la base **[NeoTravelBDD](https://airtable.com)** (menu Accueil → votre base). |
| **2** | **Supprimez** « Table 1 » *(⋯ à côté du nom → Delete table)* **ou** laissez-la vide et ignorez-la. |
| **3** | Créez **4 tables** avec ces noms **exacts** : `Demandes`, `Devis`, `Relances`, `Logs` *(bouton **+** en bas à gauche → Add table)*. |
| **4** | Dans **chaque** table : supprimez les colonnes par défaut, puis ajoutez **`id`** (*Single line text*) et **`data`** (*Long text*). |
| **5** | Copiez l'**ID de la base** dans l'URL du navigateur : `https://airtable.com/appXXXXXXXXXXXXXX/...` → notez `appXXXXXXXXXXXXXX`. |

Ensuite : donnez l'accès à cette base à votre token PAT (section ci-dessous) et renseignez `AIRTABLE_BASE_ID` en local et sur Vercel.

---

## Détail : schéma attendu par l'application

L'app lit/écrit via `airtable-store.ts` : **4 tables**, chacune avec **2 champs** seulement.

| Table     | Variable optionnelle        | Nom par défaut |
|-----------|-----------------------------|----------------|
| Demandes  | `AIRTABLE_TABLE_DEMANDES`   | Demandes       |
| Devis     | `AIRTABLE_TABLE_DEVIS`      | Devis          |
| Relances  | `AIRTABLE_TABLE_RELANCES`   | Relances       |
| Logs      | `AIRTABLE_TABLE_LOGS`       | Logs           |

### Champs requis (identiques sur les 4 tables)

| Nom du champ | Type Airtable        | Rôle                                    |
|--------------|----------------------|-----------------------------------------|
| `id`         | Single line text     | UUID NeoTravel (clé métier)             |
| `data`       | Long text            | Objet JSON complet sérialisé            |

> **Approche FU** : email, villes, prix, PDF base64, etc. sont tous dans `data`. Pas de colonnes supplémentaires.

### Exemple visuel — table « Demandes »

```
┌──────────────────────────────────────┬─────────────────────────────────┐
│ id (Single line text)                │ data (Long text)                │
├──────────────────────────────────────┼─────────────────────────────────┤
│ a1b2c3d4-...                         │ {"id":"a1b2...","email":"..."}  │
└──────────────────────────────────────┴─────────────────────────────────┘
```

Répétez la même structure pour **Devis**, **Relances** et **Logs**.

---

## Token API (Personal Access Token)

1. [airtable.com/create/tokens](https://airtable.com/create/tokens) → token `NeoTravel Vercel` (ou éditez le token existant).
2. **Scopes** minimum :
   - `data.records:read`
   - `data.records:write`
   - `schema.bases:read` *(recommandé — permet de lister les tables via l'API meta)*
3. **Access** : ajoutez explicitement la base **NeoTravelBDD** *(sans cela, l'API renvoie `bases: []` et l'app ne peut pas écrire)*.
4. Copiez le token (`pat...`) — affiché une seule fois.

### Vérifier le token (terminal, sans afficher le secret)

```bash
cd neotravel-app
# Charger AIRTABLE_API_KEY depuis .env puis :
curl -s -H "Authorization: Bearer $AIRTABLE_API_KEY" \
  https://api.airtable.com/v0/meta/bases | jq '.bases[] | {name, id}'
```

Vous devez voir une entrée `name: "NeoTravelBDD"` avec un `id` commençant par `app`.

---

## Obtenir l'ID de la base (BASE_ID)

- URL navigateur : `https://airtable.com/appXXXXXXXXXXXXXX/tbl.../...`
- L'ID est **`appXXXXXXXXXXXXXX`** (17 caractères après `app`).

---

## Variables d'environnement

### Local (`neotravel-app/.env`)

```env
AIRTABLE_API_KEY=patXXXXXXXX
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
```

Ne commitez **jamais** `.env`.

### Vercel (projet `neotravel-app`, scope **grp-16**)

Dans **Project → Settings → Environment Variables** (Production + Preview) :

| Variable            | Valeur              |
|---------------------|---------------------|
| `AIRTABLE_API_KEY`  | `pat...`            |
| `AIRTABLE_BASE_ID`  | `app...` (NeoTravelBDD) |

Redéployez après modification (`vercel --prod` ou push sur la branche liée).

---

## Vérification

### 1. Backend de stockage (gamma / prod)

```bash
curl -s https://neotravel-app-gamma.vercel.app/api/n8n/status | jq .
```

Attendu quand Airtable est actif :

```json
{
  "ok": true,
  "storage_backend": "airtable",
  ...
}
```

Si `"storage_backend": "file"` → `AIRTABLE_BASE_ID` manquant ou non déployé sur Vercel.

### 2. Écriture test (qualifier)

```bash
curl -s -X POST https://neotravel-app-gamma.vercel.app/api/n8n/qualifier \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: VOTRE_WEBHOOK_SECRET" \
  -d '{"text":"Devis 35 personnes Paris Lyon 15/07/2026 email demo@neotravel.test"}'
```

Une ligne doit apparaître dans la table **Demandes** (champ `id` + JSON dans `data`). Une entrée **Logs** est aussi créée (`demande_creee`).

### 3. Interface admin

`/admin` lit les mêmes données que Airtable.

---

## Limitations connues

| Sujet | Détail |
|-------|--------|
| **resetStore (E2E)** | Ignoré sur Airtable — tests E2E en mode fichier local |
| **Performance** | Liste tous les enregistrements (pagination 100/lot) — OK pour démo |
| **Rate limit** | ~5 req/s par base Airtable |
| **PDF dans Devis** | `pdf_content` (base64) dans `data` — limite ~100 000 caractères/cellule |
| **Concurrence** | Pas de verrouillage optimiste |

---

## Dépannage

| Symptôme | Cause probable | Action |
|----------|----------------|--------|
| `bases: []` via API meta | Token sans accès à NeoTravelBDD | Éditer le PAT → Access → cocher NeoTravelBDD |
| `storage_backend: "file"` | `AIRTABLE_BASE_ID` absent sur Vercel | Ajouter la variable + redéployer |
| **403 / NOT_FOUND** | Mauvais `AIRTABLE_BASE_ID` ou table absente | Vérifier noms exacts Demandes/Devis/Relances/Logs |
| **INVALID_VALUE_FOR_COLUMN** | `data` pas en Long text ou `id` manquant | Recréer les champs avec les bons types |
| **401 Unauthorized** | Token invalide ou scopes insuffisants | Régénérer le PAT avec read/write |
| Table 1 seulement | Schéma par défaut Airtable | Suivre la checklist en haut de ce document |

Pour revenir au stockage fichier : supprimez `AIRTABLE_API_KEY` et `AIRTABLE_BASE_ID` de l'environnement.
