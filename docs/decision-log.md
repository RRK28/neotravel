# Journal des décisions — NeoTravel (Groupe 16)

Décisions techniques majeures, datées et motivées. Format : **date — décision — contexte — conséquence**.

---

## 2026-06-23 — Option A : chat IA + agent avec tools

**Contexte :** Fiche technique Interstellabs (Option A agent conversationnel vs Option B formulaire).

**Décision :** Retenir l'**Option A** avec Vercel AI SDK et outils métier (`qualifier_demande`, `calculer_devis`, `generer_devis`, etc.).

**Conséquence :** Parcours **chat** principal (`/chat`) ; formulaire guidé en **Option B** alternatif (`/devis`).

---

## 2026-06-24 — Prix 100 % déterministe côté serveur

**Contexte :** Risque d'hallucination tarifaire par le LLM.

**Décision :** Seule `calculerDevis()` dans `neotravel-app/src/lib/pricing/calculer-devis.ts` produit un montant. Le pipeline serveur (`processDemandePipeline`) calcule le devis **avant** le LLM ; le modèle ne fait que reformuler.

**Conséquence :** `directReply` court-circuite le LLM quand le devis est prêt ; system prompt interdit d'inventer un prix.

---

## 2026-06-25 — Stockage JSON local (MVP)

**Contexte :** Délai court, pas de DBA dédié.

**Décision :** Persistance via `memory-store.ts` (fichier `.data/store.json`) plutôt que Supabase en v1.

**Conséquence :** Déploiement simple ; données non partagées entre instances Vercel (acceptable pour démo).

---

## 2026-06-26 — LLM local Ollama + fallback OpenAI

**Contexte :** Coût et souveraineté des données en dev ; fiabilité en prod.

**Décision :** `LLM_PROVIDER=ollama` par défaut ; bascule `openai` via variables d'environnement.

**Conséquence :** Mode démo (`DEMO_MODE=true`) utilisable sans clé API ; soutenance possible en local.

---

## 2026-06-27 — Orchestration n8n + API tools

**Contexte :** Automatisation des relances J+2 / J+3 / J+7 et démonstration jury de la chaîne métier complète.

**Décision :** n8n (Cloud ou Docker) **orchestre** les outils via `POST /api/n8n/*` (`qualifier`, `calculer-devis`, `generer-devis`, `relance`) ; workflow exporté dans `n8n/workflows/neotravel-orchestration.json`. Alias relance : `/api/webhooks/relance`.

**Conséquence :** n8n appelle la même logique métier que le chat Option A ; relances aussi déclenchables depuis `/admin` si n8n indisponible.

---

## 2026-06-28 — Email Brevo (SMTP) pour la démo

**Contexte :** Envoi réel de devis en soutenance.

**Décision :** Support SMTP (Brevo/Gmail) + simulation console si non configuré.

**Conséquence :** E2E passent sans SMTP ; prod Vercel avec `SMTP_*` dans le dashboard.

---

## 2026-06-29 — Estimation distance sans demander au client

**Contexte :** Le prospect ne connaît pas la distance exacte.

**Décision :** `estimerTrajet()` à partir des villes ; le chat ne demande jamais km/durée/prix au client.

**Conséquence :** Champs client limités à trajet, date, passagers, contact.
