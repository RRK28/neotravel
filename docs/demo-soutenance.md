# Script démo soutenance — NeoTravel

Durée cible : **8–10 minutes**. Préparer les onglets avant l'entrée du jury.

---

## Préparation (J-1 / H-1)

### Option recommandée — Production Vercel + n8n Cloud

```bash
# Vérifier que WEBHOOK_SECRET est défini sur Vercel (Settings → Environment Variables)
# Suivre docs/n8n-cloud-setup.md pour importer et activer le workflow
```

**URLs à noter :**
- App production : https://neotravel-app-gamma.vercel.app
- **Option A — Chat IA** : https://neotravel-app-gamma.vercel.app/chat
- Admin : https://neotravel-app-gamma.vercel.app/admin
- **Option B — Formulaire** : https://neotravel-app-gamma.vercel.app/devis
- Mode secours sans LLM : https://neotravel-app-gamma.vercel.app/chat?demo=1
- **n8n Cloud** (interface séparée) : https://app.n8n.cloud

Importer `n8n/workflows/neotravel-orchestration.json` dans n8n Cloud et activer le workflow (voir [`docs/n8n-cloud-setup.md`](n8n-cloud-setup.md)).

> n8n n'apparaît **pas** sur le site Vercel : c'est normal. n8n **orchestre** les tools métier (`/api/n8n/qualifier`, `calculer-devis`, `generer-devis`, `relance`) depuis `app.n8n.cloud`.

### Option locale (secours)

```bash
# Terminal A — App
cd neotravel-app && cp .env.example .env
# Éditer : DEMO_MODE=true, WEBHOOK_SECRET=neotravel-dev-secret, SMTP si email réel
npm install && npm run dev

# Terminal B — n8n local (fallback uniquement)
cd .. && docker compose up -d n8n
```

**URLs locales :**
- App : http://localhost:3000
- n8n local : http://localhost:5678
- Admin : http://localhost:3000/admin

---

## Déroulé pas à pas

### 1. Contexte (30 s)

> « NeoTravel automatise la qualification et le devis autocar. Le prix est **toujours** calculé par un moteur déterministe, pas par l'IA. »

Montrer `docs/note-de-cadrage.md` ou le diagramme README.

---

### 2. Landing (30 s)

1. Ouvrir `/` (Vercel ou local)
2. Montrer le badge **Propulsé par IA** (si OpenAI/Ollama configuré)
3. **CTA principal** : « Discuter avec l'assistant IA » → `/chat` (Option A)
4. **CTA secondaire** : « Formulaire devis rapide » → `/devis` (Option B)
5. Section **Comment ça marche** : IA collecte → `calculer_devis` → email PDF

---

### 3. Parcours chat — Option A, devis nominal (3 min)

Ouvrir `/chat` (pas `?demo=1` si OpenAI/Ollama est configuré — montrer le fournisseur actif en haut).

**Message à coller :**

```
Bonjour, je souhaite un devis pour 35 personnes de Paris à Lyon le 15/07/2026. Email : demo@neotravel.test
```

**Montrer :**
- Le bot ne demande **pas** la distance ni le prix
- Réponse avec **Devis TTC** (~1520 €) et lien PDF
- Expliquer : `processDemandePipeline` → `calculerDevis()` → `directReply`

**Option LLM :** si Ollama tourne, montrer que le system prompt reçoit le « RÉSULTAT BACK-OFFICE » ; le montant ne vient pas du modèle.

---

### 4. Cas incomplet (1 min)

Nouvelle session ou reset :

```
Bonjour, je voudrais un transport de Paris à Lyon
```

**Attendu :** demande d'email, date, passagers — score de complétude.

---

### 5. Cas complexe — HITL (1 min)

```
Devis pour 90 personnes de Paris à Lyon le 15/07/2026, email complexe@neotravel.test
```

**Attendu :** message escalade conseiller, pas de prix automatique.

---

### 6. Dashboard admin (2 min)

1. Ouvrir `/admin`
2. Montrer : stats, liste demandes, statuts (`devis_envoye`, `cas_complexe`)
3. Montrer relances planifiées
4. **Option :** bouton « envoyer relances » ou appel webhook

```bash
# Production Vercel
curl -X POST https://neotravel-app-gamma.vercel.app/api/webhooks/relance \
  -H "x-webhook-secret: (valeur WEBHOOK_SECRET)" \
  -H "x-app-base-url: https://neotravel-app-gamma.vercel.app"
```

5. Mentionner les **logs** dans la réponse API admin (`logs` — `calculer_devis`, `email_devis_envoye`)

---

### 7. Email (30 s)

- Si Brevo configuré : montrer la boîte mail
- Sinon : expliquer mode simulé + logs `email_devis_envoye`

---

### 8. n8n Cloud — orchestration complète (2 min)

1. Ouvrir **https://app.n8n.cloud** (onglet séparé de NeoTravel)
2. Montrer le workflow **NeoTravel — Orchestration complète** (sticky note Option A)
3. **Canvas** — parcours oral :
   - **▶ Démo jury** → chaîne complète : **GET status** → **POST qualifier** (Paris-Lyon) → **calculer-devis** → **generer-devis** → **POST relance**
   - **Toutes les 15 min** → branche relances seules (production)
   - **Config NeoTravel** → secret (mentionner sans afficher)
4. **Live demo** : cliquer **Test workflow** sur **▶ Démo jury**
5. **Executions** → nœud **Résumé orchestration** :

```json
{
  "execution_summary": {
    "mode": "demo_jury",
    "qualifier": { "demande_id": "...", "pret_pour_devis": true, "score": 100 },
    "calcul": { "prix_ttc": 1520.21 },
    "devis": { "devis_id": "...", "email_sent": true },
    "relances": { "ok": true, "traitees": 0 }
  }
}
```

6. Revenir sur `/admin` Vercel — nouvelle demande + devis créés par n8n

> « n8n **orchestre** les mêmes tools que le chat Option A, mais en HTTP REST. Ce n'est pas du code Next.js — c'est de l'automatisation externe qui appelle `qualifier`, `calculer_devis`, `generer_devis`. »

**Avant la soutenance** : vérifier `webhook_secret` dans **Config NeoTravel** (voir [`docs/n8n-cloud-setup.md`](n8n-cloud-setup.md)).

---

### 9. Fiabilité & tests (1 min)

```bash
cd neotravel-app && npm run test:unit   # golden 1520.21 € etc.
```

Citer `docs/fiabilite.md` : RGPD, prompt injection, HITL.

---

### 10. Clôture (30 s)

- Passation : `docs/passation-reprise.md` + `docs/passation-neotravel.md`
- Workflow exporté, n8n Cloud documenté (`docs/n8n-cloud-setup.md`), équipe Groupe 16

---

## Plan B (si LLM ou n8n KO)

| Brique | Fallback |
|--------|----------|
| Chat IA (Option A) | `/chat?demo=1` — mode secours sans LLM (pipeline métier actif) |
| OpenAI / Ollama | Cocher « Mode secours sans IA » dans Options avancées du chat |
| Parcours sans IA | Option B — formulaire `/devis` (`processWizardDemande`) |
| n8n Cloud | Relances via bouton admin + curl webhook Vercel |
| Email | Logs simulés |
| Docker local | Montrer le JSON workflow + expliquer l'architecture |

---

## Reset données entre démos

```bash
# Local uniquement
curl -X POST http://localhost:3000/api/test/helpers \
  -H "Content-Type: application/json" \
  -H "x-e2e-secret: neotravel-e2e" \
  -d '{"action":"reset"}'
```

(Valeur secret : voir `playwright.config.ts`.)
