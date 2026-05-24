# LESSONS.md — TechMapCongo

> Patterns et enseignements utiles pour les prochaines sessions.

---

## Architecture

**Ce qui marche bien**
- Centraliser toutes les requêtes Supabase dans `profile-service.ts` — aucun composant ne parle directement à la base. Facile à maintenir, facile à déboguer.
- Zustand pour le state global : deux stores distincts (`auth-store` pour la session, `filter-store` pour les filtres). Ne pas les fusionner même si ça semble plus simple.
- Le hook `use-filtered-profiles` avec debounce 300ms évite les requêtes inutiles quand l'utilisateur tape vite dans la recherche.

**Ce qu'on ferait différemment**
- Prévoir les notifications dès le départ, pas comme ajout tardif — ça change la structure de la base (table `notifications`) et les Edge Functions nécessaires.
- Ajouter `last_seen_at` sur `profiles` dès la création de la table, pas en migration après coup.

---

## Carte Leaflet

- Utiliser Leaflet en mode impératif (refs) plutôt que les composants react-leaflet — meilleur contrôle sur les performances avec beaucoup de marqueurs.
- Les popups HTML construits à la main fonctionnent mais sont fragiles. Pour la v2, préférer des portails React ou une sidebar latérale.
- **Toujours** passer les données utilisateur dans `escapeHtml()` avant de les injecter dans les popups. Risque XSS sinon.
- Les tiles CARTO s'adaptent au thème clair/sombre via `tileLayerRef.current.setUrl()` — pas besoin de recréer la carte.

---

## Supabase

- RLS sur toutes les tables dès le départ, même en développement. Plus facile de desserrer que de resserrer.
- Le tableau `tech_stack` PostgreSQL (`text[]`) nécessite `.overlaps()` pour les requêtes de filtre — pas `.contains()`.
- Les Edge Functions Supabase ont besoin d'un déclencheur (cron ou webhook) pour tourner automatiquement. Ne pas supposer qu'elles s'exécutent seules.

---

## Environnement de développement

- PowerShell 5.1 écrit les fichiers en UTF-16 LE avec `>`. Toujours utiliser Python ou `Out-File -Encoding utf8` pour les fichiers JSON lus ensuite par Python.
- `langcli` et `gemini` sont des scripts npm dans `C:\Users\DrSmoke\AppData\Roaming\npm\` — disponibles uniquement en PowerShell, pas en bash.
- La clé API LangRouter (pour `lc`) expire. Vérifier avant de planifier des tâches longues qui en dépendent.

---

## Produit / Communauté

- Une plateforme communautaire sans notifications est une plateforme morte. C'est la fonctionnalité la plus critique, pas une option.
- Le score numérique de matching (73%) est moins engageant qu'une explication textuelle ("vous avez React en commun et êtes tous deux à Brazzaville").
- Pour une communauté en Afrique centrale : optimiser pour mobile 3G en priorité. Lazy loading, images légères, skeleton screens.
- Prévoir dès le départ une façon de montrer l'activité récente — sans ça, la plateforme semble déserte même avec des centaines de membres.

---

## Outil : LangCLI depuis Claude Code

- `langcli` est en réalité **Claude Code lui-même**, packagé sous un autre nom npm (`langcli-com`), routé via LangRouter quand configuré — mais capable d'utiliser l'auth OAuth keychain directement.
- Pour l'invoquer depuis Claude Code (PowerShell, pas bash) : nettoyer les variables d'environnement LangRouter héritées du bash avant l'appel :
  ```powershell
  Remove-Item Env:\ANTHROPIC_BASE_URL -ErrorAction SilentlyContinue
  Remove-Item Env:\ANTHROPIC_AUTH_TOKEN -ErrorAction SilentlyContinue
  Remove-Item Env:\ANTHROPIC_API_KEY -ErrorAction SilentlyContinue
  langcli -p "prompt" --no-session-persistence
  ```
- Ne jamais invoquer depuis le Bash tool — bash charge `~/.bashrc` qui injecte les variables LangRouter (token expiré).
- La clé LangRouter (`lgrouter_Zbdw0Bizev1mGNcsckbv76iKFDknQkoOhkzIhXK4`) est expirée depuis mai 2026. À renouveler si besoin.
