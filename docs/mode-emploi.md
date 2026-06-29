# Mode d'emploi NeoTravel — version simple

**Projet :** Epitech 230, Groupe 16 — juin 2026  
**Pour qui :** commerciaux, jury, toute personne non développeur  
**Version visuelle (recommandée) :** [mode-emploi-visuel.html](mode-emploi-visuel.html) · [mode-emploi-visuel.pdf](mode-emploi-visuel.pdf)

---

## En une phrase

NeoTravel aide une entreprise de transport en autocar à **répondre plus vite** aux demandes de devis : le client décrit son trajet, le système calcule un prix fiable, envoie le devis par e-mail et relance si besoin.

---

## La règle d'or (à retenir)

> **L'intelligence artificielle discute avec le client. Le prix est toujours calculé par le programme, jamais par l'IA.**

L'IA ne doit jamais inventer ou arrondir un montant. Elle appelle une fonction de calcul qui donne toujours le même résultat pour les mêmes données.

---

## Comment un client demande un devis

Le client a **deux façons** d'arriver au même résultat :

| Voie | Comment | Pour qui |
|------|---------|----------|
| **Chat** (recommandé) | Page `/chat` — il écrit en langage naturel : « 35 personnes Paris → Lyon le 15 juillet » | La plupart des clients |
| **Formulaire** (secours) | Page `/devis` — 3 étapes guidées (trajet, contact, validation) | Si le chat ne convient pas |

### Parcours type — du client au devis

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Client    │────▶│  Site NeoTravel  │────▶│  Assistant ou   │
│  (prospect) │     │  chat ou formulaire│     │  formulaire     │
└─────────────┘     └──────────────────┘     └────────┬────────┘
                                                      │
                        ┌─────────────────────────────┘
                        ▼
              ┌──────────────────┐     ┌──────────────────┐
              │ Infos complètes ?│─Non▶│ Pose des questions│
              │ (email, date…)   │     │ (email, passagers)│
              └────────┬─────────┘     └──────────────────┘
                       │ Oui
                       ▼
              ┌──────────────────┐     ┌──────────────────┐
              │ Calcul du prix   │────▶│ Devis PDF + mail │
              │ (programme seul) │     │ envoyé au client │
              └──────────────────┘     └──────────────────┘
```

### Étapes en langage courant

1. Le client arrive sur le site et choisit le chat ou le formulaire.
2. Il indique : départ, arrivée, date, nombre de passagers, son e-mail.
3. Si une info manque, le système la demande.
4. Le prix est calculé automatiquement (voir section suivante).
5. Le client reçoit le montant et un lien vers le PDF du devis.
6. Des relances sont programmées s'il ne répond pas (voir plus bas).

**Cas particulier :** plus de 85 passagers ou plus de 800 km → un conseiller humain reprend le dossier (pas de devis automatique).

---

## Comment le prix est calculé

Le prix ne vient **pas** de l'IA. Un programme (fichier `calculer-devis.ts`) applique des règles fixes :

```
┌─────────────────────────────────────────────────────────────┐
│                    CALCUL DU DEVIS                          │
├─────────────────────────────────────────────────────────────┤
│  1. Base = distance (km) × 2,50 €  (minimum 450 €)         │
│  2. × coefficient saison (été + cher, hiver −7 %)           │
│  3. × coefficient urgence (départ < 7 jours +10 %)          │
│  4. × coefficient taille du groupe (petit bus −5 %, gros +40 %)│
│  5. + options (guide, nuit chauffeur, péages)               │
│  6. + marge commerciale 15 %                                │
│  7. + TVA 10 %                                              │
└─────────────────────────────────────────────────────────────┘
```

### Exemple — Paris → Lyon, 35 personnes, 15 juillet

| Étape | Montant indicatif |
|-------|-------------------|
| Base 465 km × 2,50 € | ~1 162 € |
| Ajustements saison / urgence / capacité | variable |
| Marge 15 % + TVA 10 % | sur le total |
| **Total TTC typique** | **~1 520 €** |

Même demande = même prix, à chaque fois. C'est testé automatiquement.

### Qui fait quoi ?

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│     IA       │     │  Programme   │     │     n8n      │
│  (dialogue)  │     │  (prix, PDF) │     │  (relances)  │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ Parle au     │     │ Calcule le   │     │ Envoie les   │
│ client       │     │ prix exact   │     │ e-mails à    │
│ Demande les  │     │ Crée le PDF  │     │ date fixe    │
│ infos        │     │ Enregistre   │     │ (J+2, J+3…)  │
│ manquantes   │     │ en base      │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
     NE CALCULE           SEUL QUI              NE PARLE
     JAMAIS LE PRIX       CALCULE LE PRIX       PAS AU CLIENT
```

---

## Comment les relances fonctionnent

Après l'envoi du devis, le client peut ne pas répondre. Le système envoie des rappels automatiques :

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Devis envoyé │────▶│  Relance 1   │────▶│  Relance 2   │
│              │     │  J+2 ou J+3  │     │  J+7         │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                    ┌─────────────────────────────┘
                    ▼
           ┌──────────────────┐
           │ Pas de réponse ?  │
           │ Dossier clôturé   │
           └──────────────────┘
```

| Type de demande | 1re relance | 2e relance | Ensuite |
|-----------------|-------------|------------|---------|
| Urgente | J+2 | — | Clôture |
| Standard | J+3 | J+7 | Clôture après 2 relances |

**En démo devant le jury :** les délais sont raccourcis (2 et 4 minutes) pour montrer le cycle complet sans attendre des jours.

L'équipe commerciale suit tout sur la page **Admin** (`/admin`) : demandes, devis, relances en attente.

---

## Rôle de n8n (en 3 phrases)

1. **n8n** est un outil d'automatisation en arrière-plan : il ne parle pas au client sur le site web.
2. Toutes les **15 minutes**, il vérifie s'il y a des relances à envoyer et déclenche les e-mails.
3. Pour la **démo jury**, un bouton dans n8n enchaîne toute la chaîne (qualification → prix → devis → relance) pour prouver que le système fonctionne.

---

## Architecture Option B — expliquée pour des humains

La fiche technique Interstellabs (`NeoTravel-Fiche-Technique-Option-B.pdf`) décrit l'**Option B** : l'assistant intelligent vit **dans le site web** (Next.js + Vercel AI SDK), pas dans n8n.

### Les 5 briques du système

```
┌─────────────────────────────────────────────────────────────────┐
│                        SITE WEB (Vercel)                        │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐           │
│  │ Accueil │  │  Chat   │  │ Formulaire│  │ Admin   │           │
│  └─────────┘  └────┬────┘  └────┬────┘  └─────────┘           │
│                    │            │                               │
│                    ▼            ▼                               │
│              ┌─────────────────────────┐                        │
│              │   Assistant IA (dialogue)│                        │
│              └───────────┬─────────────┘                        │
│                          │ appelle                              │
│                          ▼                                      │
│              ┌─────────────────────────┐                        │
│              │ Outils métier (programme)│                        │
│              │ prix · PDF · enregistrement│                      │
│              └───────────┬─────────────┘                        │
└──────────────────────────┼──────────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
  ┌────────────┐    ┌────────────┐    ┌────────────┐
  │  Fichier   │    │   E-mails  │    │    n8n     │
  │  données   │    │  (Resend)  │    │ (relances) │
  └────────────┘    └────────────┘    └────────────┘
```

| Brique | En clair |
|--------|----------|
| **Site web** | Ce que voit le client et l'équipe commerciale |
| **Assistant IA** | Comprend le message et décide quelle action lancer |
| **Outils métier** | Exécutent le prix, le PDF, l'enregistrement |
| **Fichier données** | Stocke demandes, devis et relances (JSON en prototype) |
| **n8n** | Robot planifié pour les relances et la démo |
| **E-mails** | Envoie devis et rappels au client |

### Attention : deux sens pour « Option A / B »

| Terme | Signification |
|-------|---------------|
| Option A (parcours client) | **Chat** conversationnel |
| Option B (parcours client) | **Formulaire** guidé |
| Option B (architecture technique) | **Notre choix** : IA dans le site web |
| Option A (architecture technique) | Alternative non retenue : n8n comme cerveau unique |

Nous avons l'architecture **Option B** (IA dans le site) avec le chat comme entrée principale.

---

## Statuts d'une demande

```
nouveau → incomplet → qualifié → devis envoyé → relance 1 → relance 2
                                                      ↓
                              accepté / refusé / clôturé / cas complexe
```

| Statut | Signification |
|--------|---------------|
| nouveau | Demande reçue |
| incomplet | Il manque email, date ou passagers |
| qualifié | Prêt pour le calcul |
| devis envoyé | PDF envoyé au client |
| relance 1 / 2 | Rappel envoyé |
| cas complexe | Reprise par un humain |
| clôturé | Pas de réponse après les relances |

---

## Liens utiles

| Ressource | Adresse |
|-----------|---------|
| Site en ligne | https://neotravel-app-gamma.vercel.app |
| Chat | https://neotravel-app-gamma.vercel.app/chat |
| Formulaire | https://neotravel-app-gamma.vercel.app/devis |
| Tableau de bord | https://neotravel-app-gamma.vercel.app/admin |

---

## Documents complémentaires (plus techniques)

| Document | Contenu |
|----------|---------|
| [mode-emploi-visuel.html](mode-emploi-visuel.html) | **Version visuelle** — schémas couleur, imprimable |
| [note-de-cadrage.md](note-de-cadrage.md) | Vision métier et périmètre |
| [demo-soutenance.md](demo-soutenance.md) | Script démo 8–10 min |
| [n8n-cloud-setup.md](n8n-cloud-setup.md) | Configuration n8n |
| [fiabilite.md](fiabilite.md) | Sécurité, RGPD, cas limites |

---

*Groupe 16 — Epitech 230, juin 2026.*
