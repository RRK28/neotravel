# Procédure d'usage quotidien — équipes NeoTravel

Guide pour les **commerciaux et pilotes** NeoTravel utilisant le prototype au quotidien (rubrique L3 — Passation).

---

## Accès

| Interface | URL | Public |
|-----------|-----|--------|
| Site / landing | `/` | Prospects |
| Demande devis (chat) | `/chat` | Prospects |
| Wizard formulaire | `/devis` | Prospects |
| Tableau de bord | `/admin` | Équipe interne |

En production : remplacer par l'URL Vercel (ex. `https://neotravel-xxx.vercel.app`).

---

## Parcours prospect (automatique)

1. Le client décrit son trajet (chat ou wizard).
2. Le système collecte : départ, arrivée, date, passagers, email.
3. **NeoTravel calcule** la distance et le prix — le client n'a pas à les fournir.
4. Le client reçoit le montant TTC + lien devis PDF (`/api/devis/{id}`).
5. Un email de confirmation part si SMTP configuré.
6. Des relances sont planifiées (J+2 urgent / J+3+7 standard ; 2 et 4 min en mode démo).

---

## Rôle commercial — reprise des dossiers

### Consulter le pipeline

1. Aller sur `/admin`.
2. Lire les indicateurs : leads, devis générés, cas complexes, relances en attente.
3. Parcourir la liste des demandes et leurs statuts.

### Statuts à connaître

| Statut | Action commercial |
|--------|-------------------|
| `incomplet` | Attendre que le prospect complète via chat |
| `devis_envoye` | Suivre ; relances automatiques en cours |
| `cas_complexe` | **Reprise humaine obligatoire** — appeler le prospect sous 24 h |
| `relance_1` / `relance_2` | Prospect relancé par email |
| `cloture` | Pas de réponse après 2e relance — archiver ou appel manuel |

### Cas complexes (HITL)

Déclenchés automatiquement si :
- plus de 85 passagers ;
- trajet > 800 km ;
- villes non reconnues par l'estimateur.

**Procédure :** ouvrir la demande dans l'admin, lire le motif, établir un devis manuel hors outil, mettre à jour le statut (fonction manuelle à prévoir en v2).

---

## Relances

### Automatique (n8n)

Le workflow `n8n/workflows/relance-neotravel.json` appelle le webhook toutes les 15 minutes. Aucune action humaine requise si n8n tourne.

### Manuelle (secours)

1. Aller sur `/admin`.
2. Cliquer **« Traiter les relances dues »** (si bouton présent).
3. Ou : `POST /api/webhooks/relance` avec le secret configuré.

---

## Emails

- **Devis initial :** envoyé à la création du devis.
- **Relances :** templates dans `src/lib/email/notifications.ts`.
- Si aucun SMTP : les emails sont **simulés** (logs console + entrée `email_devis_envoye` dans les logs admin).

Configurer Brevo : voir `.env.example` section SMTP.

---

## Bonnes pratiques équipe

1. **Ne jamais communiquer un prix** sans qu'il provienne du système (devis en base).
2. Vérifier chaque matin `/admin` pour les `cas_complexe`.
3. En démo client : utiliser des emails fictifs (`@neotravel.test`).
4. Ne pas partager `WEBHOOK_SECRET` ni clés SMTP.

---

## Support technique

- Reprise développeur : `docs/passation-reprise.md`
- Fiabilité / RGPD : `docs/fiabilite.md`
- Équipe projet : `docs/equipe.md`
