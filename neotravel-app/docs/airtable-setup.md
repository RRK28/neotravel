# Configuration Airtable pour NeoTravel

NeoTravel peut persister les demandes, devis, relances et logs dans **Airtable** au lieu du fichier local `.data/store.json` (éphémère sur Vercel).

Sans variables Airtable, l'application utilise automatiquement le **stockage fichier** (idéal en développement local).

## 1. Créer une base Airtable

1. Connectez-vous sur [airtable.com](https://airtable.com).
2. **Créer une base** → « Start from scratch » (ex. `NeoTravel`).
3. Créez **4 tables** avec les noms exacts (ou personnalisez via les variables d'environnement) :

| Table     | Variable optionnelle        | Défaut    |
|-----------|-----------------------------|-----------|
| Demandes  | `AIRTABLE_TABLE_DEMANDES`   | Demandes  |
| Devis     | `AIRTABLE_TABLE_DEVIS`      | Devis     |
| Relances  | `AIRTABLE_TABLE_RELANCES`   | Relances  |
| Logs      | `AIRTABLE_TABLE_LOGS`       | Logs      |

## 2. Champs requis (même schéma pour chaque table)

Chaque table doit contenir **exactement ces deux champs** :

| Nom du champ | Type Airtable      | Rôle                                      |
|--------------|--------------------|-------------------------------------------|
| `id`         | Single line text   | Identifiant UUID NeoTravel (clé métier)   |
| `data`       | Long text          | Objet JSON complet sérialisé              |

> **Approche FU** : tout le détail (email, villes, prix, PDF encodé, etc.) est stocké dans `data`. Pas besoin de mapper chaque propriété TypeScript vers une colonne Airtable.

### Exemple pour la table « Demandes »

1. Renommez la première colonne en `id` (type *Single line text*).
2. Ajoutez une colonne `data` (type *Long text*).

Répétez pour Devis, Relances et Logs.

## 3. Obtenir l'ID de la base

- Ouvrez la base dans le navigateur : l'URL ressemble à  
  `https://airtable.com/appXXXXXXXXXXXXXX/...`
- L'ID de la base est la partie `appXXXXXXXXXXXXXX`.

Vous pouvez aussi le trouver dans [Airtable API docs](https://airtable.com/developers/web/guides/personal-access-tokens) → votre base → Base ID.

## 4. Créer un token API (Personal Access Token)

1. Allez sur [airtable.com/create/tokens](https://airtable.com/create/tokens).
2. Nom : `NeoTravel Vercel`.
3. **Scopes** minimum :
   - `data.records:read`
   - `data.records:write`
4. **Access** : limitez à la base NeoTravel créée à l'étape 1.
5. Copiez le token (`pat...`) — il ne sera plus affiché ensuite.

## 5. Variables d'environnement

### Local (`.env`)

```env
AIRTABLE_API_KEY=patXXXXXXXX
AIRTABLE_BASE_ID=appXXXXXXXX
```

### Vercel

Dans **Project → Settings → Environment Variables**, ajoutez :

- `AIRTABLE_API_KEY`
- `AIRTABLE_BASE_ID`

Redéployez après modification.

## 6. Vérification

1. Lancez l'app : `npm run dev`
2. Soumettez une demande via le wizard ou le chat.
3. Dans Airtable, une nouvelle ligne doit apparaître dans **Demandes** avec un `id` UUID et un champ `data` JSON.

Le panneau admin (`/admin`) lit les mêmes données.

## Limitations connues

| Sujet | Détail |
|-------|--------|
| **resetStore (E2E)** | Ignoré sur Airtable — les tests E2E qui réinitialisent le store utilisent le mode fichier local |
| **Performance** | Chaque lecture liste tous les enregistrements d'une table (pagination 100/lot). Suffisant pour une soutenance, pas pour la production à fort volume |
| **Rate limit** | Airtable : ~5 requêtes/s par base — acceptable pour un flux démo |
| **PDF dans Devis** | Le champ `pdf_content` (base64) est inclus dans `data` — limite ~100 000 caractères par cellule Long text |
| **Pas de SDK** | Appels REST via `fetch` natif — pas de dépendance npm supplémentaire |
| **Concurrence** | Pas de verrouillage optimiste : deux mises à jour simultanées sur le même enregistrement peuvent s'écraser (rare en démo) |

## Dépannage

- **401 Unauthorized** : token invalide ou scopes insuffisants.
- **403 / NOT_FOUND** : mauvais `AIRTABLE_BASE_ID` ou table inexistante.
- **INVALID_VALUE_FOR_COLUMN** : le champ `data` n'est pas en *Long text*, ou `id` manquant.
- **Champ data vide** : enregistrement créé manuellement sans JSON valide.

Pour revenir au stockage fichier local, supprimez `AIRTABLE_API_KEY` et `AIRTABLE_BASE_ID` de votre environnement.
