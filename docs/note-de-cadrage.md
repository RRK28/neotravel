# Note de cadrage — NeoTravel

**Projet :** L1 Data Science — Epitech 230 - Master of Science  
**Équipe :** Groupe 16  
**Date :** juin 2026  
**Statut :** version de cadrage validée en équipe

---

## 1. Contexte et présentation NeoTravel

NeoTravel est une plateforme d'intermédiation en transport de groupe par autocar, active depuis 2010. L'entreprise ne possède pas de flotte : elle qualifie les besoins des clients (particuliers, entreprises, collectivités, associations), identifie l'autocariste adapté et monte la proposition commerciale.

La chaîne commerciale actuelle suit un schéma classique : captation de la demande (formulaire web, email, téléphone), qualification par un commercial, calcul manuel du tarif à partir de grilles (distance, saison, urgence, capacité, options), envoi du devis, puis relances et suivi du pipeline. Ce fonctionnement reste viable sur un faible volume, mais devient lent et peu traçable quand les demandes augmentent.

Le projet confié à l'équipe vise à automatiser une partie de cette chaîne, en gardant une reprise humaine sur les dossiers sensibles ou atypiques. Il s'inscrit dans le cadre du module Data Science d'Epitech (promotion 230).

## 2. Problématique et enjeux business

**Problématique :** le délai entre une demande entrante et l'envoi d'un devis est trop long, avec un risque d'erreur de tarification, d'oubli de relance et de perte de visibilité sur l'état des dossiers.

**Enjeux identifiés :**

- Réactivité commerciale : un prospect qui attend plusieurs jours risque de partir chez un concurrent.
- Fiabilité tarifaire : les grilles NeoTravel sont complexes ; un calcul manuel peut diverger d'une demande à l'autre.
- Traçabilité : sans outil centralisé, difficile de savoir quels devis sont en attente, relancés ou à reprendre.
- Charge opérationnelle : les commerciaux passent du temps sur des tâches répétitives (collecte d'infos, relances) au détriment des dossiers complexes.

L'automatisation ciblée doit libérer du temps humain sans dégrader la qualité de la relation client.

## 3. Objectifs du projet

Objectifs formulés de manière SMART autant que possible :

| Objectif | Formulation | Indicateur |
|----------|-------------|------------|
| Réactivité | Réduire le délai de première réponse structurée | Demande qualifiée en moins de 5 min en parcours chat |
| Qualité données | Structurer les champs dès l'entrée | Score de complétude calculé, champs manquants listés |
| Tarification fiable | Produire un devis reproductible | Même entrée = même prix via `calculer_devis()` |
| Suivi pipeline | Centraliser les statuts des demandes | Dashboard admin avec filtres par statut |
| Relances | Automatiser le suivi des devis sans réponse | Workflow n8n déclenché après envoi devis |
| Escalade | Transférer les cas limites à un humain | Règles > 85 pax, > 800 km, demande atypique |

On ne vise pas un ERP complet. L'objectif est un prototype démontrable de bout en bout, chaque brique restant volontairement simple.

## 4. Périmètre MVP et hors périmètre

**Dans le périmètre MVP :**

| Étape | Contenu |
|-------|---------|
| Captation | Landing page + chat conversationnel pour saisir la demande |
| Qualification | Vérification de complétude, calcul urgence, tag complexité |
| Devis | Moteur de règles déterministe + génération document |
| Relances | Planification automatique (J+2 urgent, J+3/J+7 standard) via n8n |
| Pilotage | Dashboard admin : liste demandes, statuts, reprise manuelle |

**Hors périmètre (v1) :**

- Réservation directe chez l'autocariste partenaire
- Facturation et paiement en ligne
- Gestion de flotte et planning véhicules
- Application mobile native
- CRM complet (historique client multi-années, scoring avancé)

## 5. Acteurs et personas

**Client / prospect** — Responsable d'un déplacement de groupe (sortie scolaire, séminaire, événement associatif). Veut une réponse rapide et un prix clair. Peut être peu à l'aise avec les détails techniques (distance exacte, options).

**Commercial NeoTravel** — Reprend les dossiers escaladés (gros groupes, trajets longs, demandes atypiques). Valide ou ajuste les propositions avant envoi définitif. Utilise le dashboard pour prioriser les relances.

**Administrateur / pilote** — Supervise le pipeline global : volumes, taux de conversion, dossiers bloqués. Peut forcer un changement de statut ou réassigner un dossier.

## 6. Parcours cible

Le prototype automatise la **chaîne commerciale complète** décrite dans la fiche technique Interstellabs. Le chatbot n'est qu'une porte d'entrée : le livrable couvre captation, qualification, devis, relances et pilotage.

**Parcours nominal (Option B — Vercel AI SDK) :**

1. **Captation** — Le prospect arrive sur la landing Next.js et ouvre le chat (`/chat`). Il exprime son besoin en langage naturel (trajet, dates, passagers, contact).
2. **Qualification** — L'agent IA (Vercel AI SDK) détecte les informations manquantes, l'urgence et la complexité via l'outil `qualifier_demande`. Les champs incomplets sont redemandés explicitement.
3. **Devis** — Une fois la demande qualifiée, l'agent appelle `calculer_devis()` (code pur, jamais le LLM) puis `generer_devis()` pour produire le PDF et mettre à jour le pipeline.
4. **Suivi** — Envoi email (Brevo/SMTP), planification des relances (J+2 urgent, J+3/J+7 standard) enregistrée en base ; n8n déclenche les envois à date fixe.
5. **Pilotage** — Le commercial consulte `/admin` : KPIs, statuts, demandes urgentes, cas complexes.
6. **Reprise humaine** — Si la demande dépasse les seuils (> 85 passagers, trajet hors zone, options atypiques), l'agent appelle `escalader_humain` et le statut passe en `cas_complexe`.

**Parcours alternatif sans LLM** : formulaire guidé en 3 étapes sur `/devis` — même pipeline métier (`processDemandePipeline`), utile pour la démo ou les prospects qui préfèrent un formulaire structuré. Ce n'est pas l'« Option B » de la fiche technique (qui désigne la stack Vercel AI SDK).

**Statuts du pipeline :** nouveau → incomplet → qualifie → devis_envoye → relance_1 / relance_2 → accepte / refuse / cloture / cas_complexe

## 7. Architecture fonctionnelle et technique (Option B)

Architecture retenue conformément à la fiche technique Interstellabs (**Option B — Vercel AI SDK**) : l'intelligence conversationnelle est dans Next.js ; n8n reste en arrière-plan pour les tâches planifiées.

```
PROSPECT
   |
   v
[ Landing + Chat Next.js ]  <--->  streaming temps réel
   |
   v
[ Agent IA (Vercel AI SDK) ]  -- decide quels outils appeler
   |
   +---> qualifier_demande()  ----> Store (Demandes)
   +---> lookup_matrices()    ----> Store (Matrices)
   +---> calculer_devis()     ----> CODE PUR (pas d'IA)
   +---> generer_devis()      ----> PDF + Store (Devis)
   +---> planifier_relance()  ----> Store (Relances)
   +---> escalader_humain()   ----> notification equipe
   |
   v
[ n8n — planifie ]  --->  POST /api/webhooks/relance  --->  emails J+2 / J+3 / J+7
   |
   v
[ Dashboard /admin ]  --->  KPIs, pipeline, urgences
```

**Les 5 briques du système (fiche technique) :**

| Brique | Technologie | Rôle |
|--------|-------------|------|
| Interface prospect | Next.js sur Vercel | Site web + chat en temps réel |
| Agent IA | Vercel AI SDK | Mène la conversation et décide quoi faire |
| Outils métier | TypeScript | Exécutent les actions (prix, PDF, CRM) |
| Base de données | Supabase (cible) / JSON local (MVP) | Stocke demandes, devis, relances, logs |
| Back-office | n8n | Relances automatiques à date fixe |
| Emails | Brevo (SMTP) | Envoi des devis et relances |
| Pilotage | Page `/admin` Next.js | Tableau de bord direction |

**Option A vs Option B (fiche Interstellabs) :**

- **Option A** : l'agent conversationnel est porté par **n8n** (workflows visuels). Un seul « cerveau » orchestrateur.
- **Option B (retenue)** : l'agent est codé dans **Next.js avec Vercel AI SDK** ; n8n ne gère que les relances planifiées, pas le dialogue.

**Rôle de n8n dans notre prototype :** workflow planifié qui appelle `POST /api/webhooks/relance` pour traiter les relances dues. Un workflow d'orchestration complète (`/api/n8n/*`) existe en complément pour la démo jury, mais ce n'est pas le cœur de l'architecture Option B.

**Qui fait quoi :** l'IA dialogue et choisit le prochain outil ; le code exécute (`calculer_devis`, PDF, écriture en base) ; n8n envoie les relances à date fixe. L'IA ne calcule jamais le prix.

## 8. Règle d'or : l'IA ne calcule jamais le prix

**Principe non négociable :** le LLM ne doit jamais estimer, arrondir ou inventer un montant. Seule la fonction `calculer_devis()` (moteur déterministe TypeScript) produit un prix.

L'agent dispose de six outils :

- `qualifier_demande` — enregistre et complète la demande
- `lookup_matrices` — consulte les coefficients (informatif uniquement)
- `calculer_devis` — seul outil autorisé pour obtenir un tarif
- `generer_devis` — crée le document et met à jour le statut
- `planifier_relance` — programme les relances
- `escalader_humain` — transfère à un commercial

Les matrices tarifaires (saison, urgence, capacité, options, marge, TVA) sont codées dans `matrices.ts`. Toute modification de règle passe par ce module, pas par le prompt de l'agent.

## 9. Stack technique détaillée

| Couche | Technologie | Rôle |
|--------|-------------|------|
| Front | Next.js 15 (App Router) | Landing, chat, dashboard admin |
| Agent | Vercel AI SDK | Orchestration LLM + tools |
| LLM | Ollama (local) ou OpenAI (API) | Dialogue naturel, configurable |
| Pricing | TypeScript pur (`calculer-devis.ts`) | Calcul déterministe, testable |
| PDF | Génération HTML/texte | Aperçu devis exportable |
| Automatisation | n8n (Cloud ou Docker) | Relances planifiées (back-office) |
| Stockage | JSON local (memory-store) | Persistance MVP ; Supabase prévu en cible |
| Emails | Brevo (SMTP) | Envoi devis et relances |
| Tests | Vitest + Playwright | Unitaires pricing + E2E parcours |
| Déploiement | Vercel ou Docker local | Environnement de démo |

n8n tourne en local via `docker-compose.yml` ou en Cloud (`app.n8n.cloud`). Rôle principal : déclencher `POST /api/webhooks/relance` selon le calendrier J+2 / J+3 / J+7 (délais raccourcis en démo jury).

## 10. Planning prévisionnel

Planning sur 4 semaines, démarrage juin 2026 :

| Semaine | Livrables |
|---------|-----------|
| S1 (23-27 juin) | Cadrage, lecture docs NeoTravel, validation stack, maquettes flux, squelette Next.js |
| S2 (30 juin - 4 juil.) | Landing, chat UI, modèle de données demande, store JSON |
| S3 (7-11 juil.) | Agent IA + tools, moteur `calculer_devis`, tests unitaires pricing |
| S4 (14-18 juil.) | Dashboard admin, workflows n8n, tests E2E, doc, préparation soutenance |

Les dates sont indicatives et seront ajustées selon l'avancement réel et le calendrier Epitech.

## 11. Équipe — Groupe 16

**Promotion :** Epitech 230 - Master of Science  
**Groupe :** 16 (4 personnes)

| Membre | Rôle principal | Responsabilités |
|--------|----------------|-----------------|
| Rémy PICARD | Dev front | Landing, interface chat, dashboard admin, intégration UI |
| Louis MAILLARD | Dev back / API | Routes API, moteur `calculer_devis`, matrices tarifaires, tests unitaires |
| Romain MOUSSIE | Agent IA | Vercel AI SDK, system prompt, tools, branchement Ollama/OpenAI |
| Rezki BESSAHLI | Intégration & doc | n8n, webhooks relance, docker-compose, documentation, démo soutenance |

Chacun peut intervenir en appui sur les autres lots. Les points hebdomadaires permettent de rééquilibrer si besoin.

## 12. Risques et mitigations

| Risque | Impact | Mitigation |
|--------|--------|------------|
| LLM invente un prix malgré les consignes | Élevé | Tools obligatoires, tests, règle codée dans le system prompt |
| Ollama indisponible en démo | Moyen | Fallback OpenAI via variable d'environnement |
| Matrices tarifaires incomplètes | Moyen | S'appuyer sur les docs NeoTravel fournies, valider avec un cas test |
| n8n non configuré à temps | Moyen | Relances simulables en mode démo (délais raccourcis) |
| Dépassement périmètre 4 semaines | Moyen | Prioriser le parcours nominal, reporter Supabase si nécessaire |
| Données prospect fictives en démo | Faible | Jeu de données de test, pas de prod |

## 13. KPIs et critères de succès

**Critères de succès du MVP :**

- Parcours complet démontrable : demande chat → devis généré → relance planifiée → visible dans le dashboard
- Zéro prix calculé par le LLM en dehors de `calculer_devis()`
- Tests unitaires du moteur de pricing passants
- Au moins un scénario E2E validé (Playwright)
- Documentation de passation lisible pour la soutenance

**KPIs indicatifs (mesurables en démo) :**

- Temps de qualification d'une demande type : < 5 minutes
- Taux de complétude atteint sans intervention humaine : objectif > 80 % sur cas standard
- Délai génération devis après qualification : < 30 secondes
- Dossiers escaladés correctement identifiés dans le dashboard

## 14. Hypothèses et contraintes

**Hypothèses :**

- Les grilles tarifaires fournies par NeoTravel sont suffisantes pour le MVP
- La distance peut être saisie ou estimée par le prospect (pas d'API carto obligatoire en v1)
- Les relances email peuvent être simulées (log + webhook) sans SMTP production
- L'équipe dispose de machines capables de faire tourner Ollama ou d'une clé OpenAI

**Contraintes :**

- Délai projet : 1 semaine (fiche technique) ; planning interne étendu sur 4 semaines pour le Groupe 16
- Stack **Option B** imposée par la fiche Interstellabs : Next.js + **Vercel AI SDK** (agent dans le code) + **n8n** (relances planifiées uniquement) + base de données (Supabase en cible)
- Règle d'architecture : un seul cerveau agent — AI SDK **ou** n8n, pas les deux en parallèle pour le dialogue
- Interdit : laisser le LLM calculer un prix ou envoyer une offre engageante sans garde-fou
- Niveau attendu : prototype fonctionnel couvrant toute la chaîne commerciale, pas production-ready
- Soutenance Epitech (01/07) : démo live 20 min + Q&R sur les choix techniques

## 15. Prochaines étapes

1. Valider cette note de cadrage en réunion d'équipe (Groupe 16)
2. Initialiser le repo et le squelette Next.js (`neotravel-app/`)
3. Implémenter le store JSON et le modèle `Demande` / `Devis`
4. Brancher l'agent avec les six tools et le system prompt
5. Connecter n8n au webhook de relance
6. Préparer le jeu de scénarios de démo pour la soutenance

---

*Document rédigé par le Groupe 16 — Epitech 230 - Master of Science, juin 2026.*
