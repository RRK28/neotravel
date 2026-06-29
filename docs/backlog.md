# Backlog — NeoTravel (Groupe 16)

Backlog du sprint MVP NeoTravel.

## Fait (Done)

| ID | User story | Priorité |
|----|------------|----------|
| NEO-01 | Landing + navigation site | P0 |
| NEO-02 | Chat qualification + pipeline devis serveur | P0 |
| NEO-03 | Moteur `calculerDevis` + matrices | P0 |
| NEO-04 | Dashboard admin (stats, demandes, relances) | P0 |
| NEO-05 | Webhook relances `/api/webhooks/relance` | P0 |
| NEO-06 | Email confirmation devis (Brevo/SMTP) | P1 |
| NEO-07 | Tests E2E Playwright (3 scénarios) | P0 |
| NEO-08 | Tests unitaires pricing (Vitest) | P0 |
| NEO-09 | Export workflow n8n | P1 |
| NEO-10 | Documentation passation + démo | P0 |
| NEO-11 | Wizard devis (formulaire multi-étapes) | P1 |

---

## En cours / À valider

| ID | User story | Priorité | Notes |
|----|------------|----------|-------|
| NEO-12 | Déploiement Vercel stable + env prod | P0 | Voir `neotravel-app/docs/DEPLOY-VERCEL.md` |
| NEO-13 | Tunnel n8n opérationnel jour J | P0 | `scripts/n8n-online.sh` |

---

## Backlog (À faire — post-MVP)

| ID | User story | Priorité |
|----|------------|----------|
| NEO-20 | Auth admin (mot de passe / SSO) | P2 |
| NEO-21 | Migration Supabase | P2 |
| NEO-22 | API distance réelle (Google/OSRM) | P2 |
| NEO-23 | Acceptation devis en ligne | P3 |
| NEO-24 | Observabilité coût LLM par dossier | P3 |

---

## Définition of Done (DoD)

- Code mergé sur la branche principale du groupe
- Test unitaire ou E2E associé si logique métier
- Variable d'env documentée dans `.env.example`
- Pas de prix calculé hors `calculerDevis()`
