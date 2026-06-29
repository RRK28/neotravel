# Rétrospective — NeoTravel (Groupe 16)

Sprint MVP Interstellabs, juin 2026. Point fait en fin de sprint (~30 min).

---

## Ce qui a bien marché

- **Pricing séparé du LLM** : moins de surprises sur les montants, tests golden stables (1520,21 € Paris–Lyon).
- **Pipeline serveur** (`demande-ingest.ts`) : la démo tient même quand Ollama est lent ou absent.
- **Docker n8n + `scripts/n8n-online.sh`** : relances testables en local, tunnel documenté pour le jury.
- **Playwright** : trois scénarios (devis nominal, incomplet, escalade) rejouables avant la soutenance.

---

## Points difficiles

- **SMTP Brevo + variables Vercel** : beaucoup de temps perdu sur les secrets et les redeploys.
- **LLM local** parfois indisponible → on a renforcé `directReply` et le mode démo chat.
- **Docker** : manque d'espace disque sur une machine du groupe au début.

---

## Actions suivies

| Action | Qui | Statut |
|--------|-----|--------|
| README lancement + env | Rezki | fait |
| Export workflow n8n relance | Rezki | fait |
| Tests unitaires `calculerDevis` | Louis | fait |
| Script démo soutenance | Rezki | fait |
| Vérifier env Vercel avant jury | Rémy | à faire |

---

## Pistes v2 (hors MVP)

- PostgreSQL / Supabase pour persistance multi-instances.
- Suivi coût tokens par devis.
- Auth admin.
- Distance réelle via API carto.
