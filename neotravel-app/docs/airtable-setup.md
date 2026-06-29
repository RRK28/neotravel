# Configuration Airtable pour NeoTravel

NeoTravel peut persister les demandes, devis, relances et logs dans **Airtable** au lieu du fichier local `.data/store.json` (éphémère sur Vercel).

Sans `AIRTABLE_API_KEY` **et** `AIRTABLE_BASE_ID`, l'application utilise le **stockage fichier** (`storage_backend: "file"` sur `/api/n8n/status`).

---

## Création automatique via API Meta (recommandé)

Un script ou des appels `curl` peuvent créer le schéma NeoTravel sans manipuler l'interface Airtable.

### Prérequis PAT

1. [airtable.com/create/tokens](https://airtable.com/create/tokens) → éditez le token `NeoTravel Vercel`.
2. **Scopes** minimum :
   - `data.records:read`
   - `data.records:write`
   - `schema.bases:read` *(lister les bases et tables)*
   - `schema.bases:write` *(créer une base ou des tables — requis pour l'automatisation)*
3. **Access** : cochez au moins une base accessible au token *(ou « All current and future bases » en dev)*.

### Option A — Créer une base « NeoTravel » complète

```bash
cd neotravel-app
source <(grep -E '^AIRTABLE_API_KEY=' .env | sed 's/^/export /')

curl -s -X POST \
  -H "Authorization: Bearer $AIRTABLE_API_KEY" \
  -H "Content-Type: application/json" \
  https://api.airtable.com/v0/meta/bases \
  -d '{
    "name": "NeoTravel",
    "tables": [
      {"name":"Demandes","fields":[{"name":"id","type":"singleLineText"},{"name":"data","type":"multilineText"}]},
      {"name":"Devis","fields":[{"name":"id","type":"singleLineText"},{"name":"data","type":"multilineText"}]},
      {"name":"Relances","fields":[{"name":"id","type":"singleLineText"},{"name":"data","type":"multilineText"}]},
      {"name":"Logs","fields":[{"name":"id","type":"singleLineText"},{"name":"data","type":"multilineText"}]}
    ]
  }'
```

> Si la réponse est **422** ou **403**, le PAT n'a pas le scope `schema.bases:write` ou Airtable refuse la création multi-tables — passez à l'option B.

### Option B — Tables dans une base existante (déployé Groupe 16)

Si `GET /v0/meta/bases` liste une base accessible (ex. `Untitled Base`, id `appx9fCuMqI40jfNO`) :

```bash
BASE_ID="appx9fCuMqI40jfNO"   # remplacez par votre id

for TABLE in Demandes Devis Relances Logs; do
  curl -s -X POST \
    -H "Authorization: Bearer $AIRTABLE_API_KEY" \
    -H "Content-Type: application/json" \
    "https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables" \
    -d "{\"name\":\"$TABLE\",\"fields\":[{\"name\":\"id\",\"type\":\"singleLineText\"},{\"name\":\"data\",\"type\":\"multilineText\"}]}"
done
```

- La table par défaut **Table 1** peut rester vide (l'app l'ignore) ; la suppression via API meta n'est pas toujours disponible.
- Renommez la base en **NeoTravel** dans l'UI Airtable si souhaité.

**Base configurée (juin 2026)** : `AIRTABLE_BASE_ID=appx9fCuMqI40jfNO` — tables `Demandes`, `Devis`, `Relances`, `Logs` avec champs `id` + `data`.

### Option C — Base visible dans l'UI mais absente de l'API

Symptôme : l'interface montre **NeoTravelBDD** avec 4 tables, mais `curl …/meta/bases` renvoie `bases: []` ou une autre base seulement.

**Cause** : le PAT n'a pas accès à NeoTravelBDD.

**Action** (1 clic) : [airtable.com/create/tokens](https://airtable.com/create/tokens) → éditer le token → section **Access** → cocher **NeoTravelBDD** → Save. Relancez `GET /v0/meta/bases` pour récupérer le `app…` correct.

### Après création API

```bash
# .env local
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX

# Vercel (scope grp-16)
printf '%s' "$AIRTABLE_BASE_ID" | npx vercel env add AIRTABLE_BASE_ID production --scope grp-16 --yes
printf '%s' "$AIRTABLE_BASE_ID" | npx vercel env add AIRTABLE_BASE_ID preview --scope grp-16 --yes
bash scripts/deploy-vercel.sh
```

Vérification :

```bash
curl -s https://neotravel-app-gamma.vercel.app/api/n8n/status | jq .storage_backend
# → "airtable"
```

---

## Checklist rapide (base **NeoTravelBDD** — manuel UI)

> La table par défaut **Table 1** (colonnes *Name*, *Notes*) **n'est pas** le schéma NeoTravel. Ne la renommez pas en « Demandes » : créez de **nouvelles** tables ou supprimez Table 1.

| Étape | Action dans l'interface Airtable |
|-------|----------------------------------|
| **1** | Ouvrez la base **[NeoTravelBDD](https://airtable.com)** (menu Accueil → votre base). |
| **2** | **Supprimez** « Table 1 » *(⋯ à côté du nom → Delete table)* **ou** laissez-la vide et ignorez-la. |
| **3** | Créez **4 tables** avec ces noms **exacts** : `Demandes`, `Devis`, `Relances`, `Logs` *(bouton **+** en bas à gauche → Add table)*. |
| **4** | Dans **chaque** table : corrigez les colonnes (procédure détaillée ci-dessous — **y compris Logs**). |
| **5** | Copiez l'**ID de la base** dans l'URL du navigateur : `https://airtable.com/appXXXXXXXXXXXXXX/...` → notez `appXXXXXXXXXXXXXX`. |

Ensuite : donnez l'accès à cette base à votre token PAT (section ci-dessous) et renseignez `AIRTABLE_BASE_ID` en local et sur Vercel.

### Corriger les colonnes — procédure en 3 étapes (à répéter sur **chaque** table)

> Airtable crée par défaut *Name*, *Notes*, *Assignee* (et parfois *Status*, *Attachments*). L'application **n'utilise que** `id` + `data`. Si ces colonnes par défaut restent, les écritures échouent (`UNKNOWN_FIELD_NAME` ou `INVALID_VALUE_FOR_COLUMN`).

**Table Demandes**

1. Cliquez sur l'onglet **Demandes** en bas de l'écran.
2. **Renommez** la colonne *Name* en `id` *(clic sur l'en-tête → Rename field)* — type **Single line text**. **Supprimez** *Notes*, *Assignee* et toute autre colonne par défaut *(clic sur l'en-tête → Delete field)*.
3. **Ajoutez** une colonne `data` : bouton **+** à droite des colonnes → **Long text**.

**Table Devis**

1. Cliquez sur l'onglet **Devis**.
2. **Renommez** *Name* → `id` (Single line text). **Supprimez** *Notes*, *Assignee* et les colonnes par défaut restantes.
3. **Ajoutez** `data` (Long text).

**Table Relances**

1. Cliquez sur l'onglet **Relances**.
2. **Renommez** *Name* → `id` (Single line text). **Supprimez** *Notes*, *Assignee* et les colonnes par défaut restantes.
3. **Ajoutez** `data` (Long text).

**Table Logs** *(souvent oubliée — même schéma que les 3 autres)*

1. Cliquez sur l'onglet **Logs**.
2. **Renommez** *Name* → `id` (Single line text). **Supprimez** *Notes*, *Assignee* et les colonnes par défaut restantes.
3. **Ajoutez** `data` (Long text).

**Résultat attendu** : chaque table n'a **que 2 colonnes** — `id` puis `data`, dans cet ordre.

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

### Noms de champs exacts attendus par `airtable-store.ts`

L'API Airtable reçoit pour chaque création/mise à jour :

```json
{
  "fields": {
    "id": "<uuid-neotravel>",
    "data": "<json-stringifié-de-l-objet-complet>"
  }
}
```

| Erreur Airtable | Cause |
|-----------------|-------|
| `UNKNOWN_FIELD_NAME` pour `id` ou `data` | Colonnes par défaut (*Name*, *Notes*…) non remplacées par `id` + `data` |
| `INVALID_VALUE_FOR_COLUMN` sur `data` | `data` n'est pas de type **Long text** (ex. encore *Notes* en multiline par défaut sans renommage) |
| `NOT_FOUND` sur la table | Nom de table différent de `Demandes` / `Devis` / `Relances` / `Logs` (casse incluse) |

---

## Token API (Personal Access Token)

1. [airtable.com/create/tokens](https://airtable.com/create/tokens) → token `NeoTravel Vercel` (ou éditez le token existant).
2. **Scopes** minimum :
   - `data.records:read`
   - `data.records:write`
   - `schema.bases:read` *(lister bases/tables via API meta)*
   - `schema.bases:write` *(créer base/tables via API — section « Création automatique »)*
3. **Access** : ajoutez explicitement la base cible *(NeoTravelBDD ou la base créée via API — sans cela, l'API renvoie `bases: []` et l'app ne peut pas écrire)*.
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
| **403** ou **INVALID_PERMISSIONS** sur `/meta/bases` | PAT sans `schema.bases:write` | [airtable.com/create/tokens](https://airtable.com/create/tokens) → ajouter `schema.bases:read` + `schema.bases:write` |
| **422** sur `POST /meta/bases` | Création multi-tables refusée | Utiliser l'option B (tables une par une dans une base existante) |
| `bases: []` via API meta | Token sans accès à NeoTravelBDD | Éditer le PAT → Access → cocher NeoTravelBDD |
| API meta liste **Untitled Base** ou **Table 1** seulement, mais l'UI montre **NeoTravelBDD** avec 4 tables | Le PAT n'a accès qu'à une autre base | [airtable.com/create/tokens](https://airtable.com/create/tokens) → éditer le token → **Access** → ajouter **NeoTravelBDD** (pas seulement la base par défaut) |
| 4 tables OK mais **Logs** a encore *Name* / *Notes* / *Assignee* | Colonnes non corrigées sur Logs | Suivre la procédure en 3 étapes pour l'onglet **Logs** (ci-dessus) |
| `storage_backend: "file"` | `AIRTABLE_BASE_ID` absent sur Vercel | Ajouter la variable + redéployer |
| **403 / NOT_FOUND** | Mauvais `AIRTABLE_BASE_ID` ou table absente | Vérifier noms exacts Demandes/Devis/Relances/Logs |
| **INVALID_VALUE_FOR_COLUMN** | `data` pas en Long text ou `id` manquant | Recréer les champs avec les bons types |
| **401 Unauthorized** | Token invalide ou scopes insuffisants | Régénérer le PAT avec read/write |
| Table 1 seulement | Schéma par défaut Airtable | Suivre la checklist en haut de ce document |

Pour revenir au stockage fichier : supprimez `AIRTABLE_API_KEY` et `AIRTABLE_BASE_ID` de l'environnement.
