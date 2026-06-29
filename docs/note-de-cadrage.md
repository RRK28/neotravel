# Note de cadrage — NeoTravel

**Projet :** L1 Data Science — Epitech 230 - Master of Science  
**Équipe :** Groupe 16  
**Date :** juin 2026  
**Statut :** version de cadrage validée en équipe

> **Documentation technique complète :** voir [`docs/mode-emploi.md`](mode-emploi.md) (architecture, schémas, API, n8n, déploiement).

---

## 1. Contexte et présentation NeoTravel

NeoTravel est une plateforme d'intermédiation en transport de groupe par autocar, active depuis 2010. L'entreprise ne possède pas de flotte : elle qualifie les besoins des clients (particuliers, entreprises, collectivités, associations), identifie l'autocariste adapté et monte la proposition commerciale.

La chaîne commerciale actuelle suit un schéma classique : captation de la demande (formulaire web, email, téléphone), qualification par un commercial, calcul manuel du tarif à partir de grilles (distance, saison, urgence, capacité, options), envoi du devis, puis relances et suivi du pipeline. Ce fonctionnement reste viable sur un faible volume, mais devient lent et peu traçable quand les demandes augmentent (~60 leads/jour, équipe de 3 à 4 personnes).

Le projet confié à l'équipe vise à automatiser une partie de cette chaîne, en gardant une reprise humaine sur les dossiers sensibles ou atypiques.

## 2. Problématique et enjeux business

**Problématique :** le délai entre une demande entrante et l'envoi d'un devis est trop long, avec un risque d'erreur de tarification, d'oubli de relance et de perte de visibilité sur l'état des dossiers.

**Enjeux :** réactivité commerciale, fiabilité tarifaire, traçabilité du pipeline, réduction de la charge opérationnelle répétitive.

## 3. Objectifs du projet

| Objectif | Indicateur |
|----------|------------|
| Réactivité | Demande qualifiée en moins de 5 min (parcours chat) |
| Qualité données | Score de complétude, champs manquants listés |
| Tarification fiable | Même entrée = même prix via `calculer_devis()` |
| Suivi pipeline | Dashboard admin avec filtres par statut |
| Relances | Workflow n8n après envoi devis |
| Escalade | Règles > 85 pax, > 800 km, demande atypique |

On ne vise pas un ERP complet — prototype démontrable de bout en bout.

## 4. Périmètre MVP et hors périmètre

**Dans le périmètre :** captation (landing + chat + formulaire), qualification, devis déterministe, relances n8n, dashboard admin.

**Hors périmètre v1 :** réservation autocariste, facturation en ligne, flotte, app mobile, CRM multi-années.

## 5. Acteurs et personas

- **Prospect** — veut une réponse rapide et un prix clair
- **Commercial NeoTravel** — reprend les dossiers escaladés, valide les propositions
- **Administrateur** — supervise le pipeline global via `/admin`

## 6. Parcours cible

| Parcours | Route | Description |
|----------|-------|-------------|
| **Option A** (principal) | `/chat` | Assistant IA — collecte en langage naturel |
| **Option B** (alternatif) | `/devis` | Formulaire guidé 3 étapes — sans LLM |

Les deux convergent vers le même moteur `calculerDevis()`. Voir les diagrammes de séquence dans [`mode-emploi.md`](mode-emploi.md#3-parcours-utilisateur).

**Statuts :** nouveau → incomplet → qualifie → devis_envoye → relance_1/2 → accepte/refuse/cloture/cas_complexe

## 7. Architecture (résumé)

Architecture retenue : **Option B technique (Vercel AI SDK)** de la fiche Interstellabs — agent IA dans Next.js, n8n en back-office pour relances.

| Couche | Technologie |
|--------|-------------|
| Front + Agent | Next.js 15 + Vercel AI SDK |
| Pricing | TypeScript `calculer-devis.ts` |
| Automatisation | n8n Cloud → `/api/n8n/*` |
| Stockage MVP | JSON local (`memory-store`) |
| Déploiement | Vercel + n8n Cloud |

Schémas détaillés, API et configuration : [`mode-emploi.md`](mode-emploi.md#2-architecture-technique).

## 8. Règle d'or

**Le LLM ne calcule jamais le prix.** Six outils métier (`qualifier_demande`, `lookup_matrices`, `calculer_devis`, `generer_devis`, `planifier_relance`, `escalader_humain`) — seul `calculer_devis` produit un tarif.

## 9. Stack et déploiement

Next.js, Vercel AI SDK, Ollama/OpenAI, n8n, Vitest + Playwright. Détail des variables d'env et procédures : [`mode-emploi.md`](mode-emploi.md#9-déploiement) et [`neotravel-app/docs/DEPLOY-VERCEL.md`](../neotravel-app/docs/DEPLOY-VERCEL.md).

## 10. Planning prévisionnel

| Semaine | Livrables |
|---------|-----------|
| S1 | Cadrage, validation stack, squelette Next.js |
| S2 | Landing, chat UI, store JSON |
| S3 | Agent + tools, moteur pricing, tests unitaires |
| S4 | Dashboard, n8n, E2E, doc, soutenance |

## 11. Équipe — Groupe 16

| Membre | Rôle |
|--------|------|
| Rémy PICARD | Dev front — landing, chat, admin |
| Louis MAILLARD | Dev back — API, pricing, tests |
| Romain MOUSSIE | Agent IA — SDK, prompt, tools |
| Rezki BESSAHLI | Intégration — n8n, doc, démo |

## 12. Risques et mitigations

| Risque | Mitigation |
|--------|------------|
| LLM invente un prix | Tools obligatoires + tests + prompt |
| Ollama indisponible en démo | Fallback OpenAI ou `/chat?demo=1` |
| n8n non configuré | Relances manuelles via admin |
| Matrices incomplètes | Golden dataset + validation cas test |

## 13. KPIs et critères de succès

- Parcours complet démontrable : chat → devis → relance → dashboard
- Zéro prix calculé par le LLM
- Tests unitaires pricing passants
- Au moins un scénario E2E Playwright
- Documentation de passation (mode d'emploi + PDF)

## 14. Hypothèses et contraintes

- Grilles tarifaires NeoTravel suffisantes pour le MVP
- Distance estimée si non fournie (pas d'API carto obligatoire)
- Relances simulables en mode démo (délais raccourcis)
- Délai projet ~4 semaines, niveau prototype fonctionnel

## 15. Prochaines étapes

1. Valider cette note en réunion d'équipe
2. Maintenir le mode d'emploi à jour avec le code
3. Préparer les scénarios de démo ([`demo-soutenance.md`](demo-soutenance.md))
4. Livrer L3 passation (PDF mode d'emploi)

---

*Document rédigé par le Groupe 16 — Epitech 230 - Master of Science, juin 2026.*
