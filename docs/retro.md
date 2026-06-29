# Rétrospective — NeoTravel (Groupe 16)

**Sprint :** MVP Interstellabs — juin 2026  
**Facilitateur :** équipe  
**Durée :** 30 min

---

## Ce qui a bien fonctionné

- Séparation nette **LLM / pricing** : moins de bugs tarifaires, tests golden reproductibles.
- Pipeline serveur (`demande-ingest.ts`) : démo fiable même avec un LLM faible (Ollama local).
- Docker n8n + script `scripts/n8n-online.sh` : accès tunnel documenté pour la soutenance.
- Tests Playwright sur le parcours nominal (devis, incomplet, escalade).

---

## Ce qui a été difficile

- Configuration email (SMTP Brevo) et variables Vercel : temps perdu sur les secrets.
- LLM local parfois lent ou indisponible → nécessité du mode `directReply` et démo chat.
- Espace disque Docker sur certaines machines (blocage `docker compose up`).

---

## Actions décidées

| Action | Responsable | Statut |
|--------|-------------|--------|
| Documenter lancement + env dans README | Rezki | ✅ |
| Export workflow n8n relance | Rezki | ✅ |
| Tests unitaires `calculerDevis` (Vitest) | Louis | ✅ |
| Script démo soutenance | Rezki | ✅ |
| Vérifier env Vercel avant jury | Rémy | À faire |

---

## Améliorations pour une v2 (hors périmètre MVP)

- Base PostgreSQL / Supabase pour persistance multi-instances.
- Observabilité avancée (coût tokens par devis, dashboard traces).
- Authentification admin.
- Géocodage distance réel (API carto).
