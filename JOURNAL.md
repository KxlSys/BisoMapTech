# JOURNAL.md — TechMapCongo

> Historique des sessions de travail significatives.

---

## 2026-05-24 — Implémentation complète (session 2)

**Réalisé en une passe :**

- **Migration SQL** : ajout `last_seen_at` sur `profiles` + table `reports` pour la modération (avec RLS admin-only)
- **Activité en temps réel** : `last_seen_at` mis à jour à chaque connexion via `fetchProfile()` dans auth-store
- **ProfileCard** : indicateur visuel "En ligne / il y a Xmin/Xh/Xj" + point vert sur l'avatar si actif
- **Stats réelles** : `usePlatformStats` hook — login page et about page affichent les vraies données Supabase
- **About page** : réécriture complète data-driven — rôles, techs, villes et graphique mensuel calculés depuis les profils réels
- **Matching** : raisons affichées comme chips colorés (au lieu de texte gris illisible)
- **Messagerie Realtime** : souscription Supabase Realtime sur `messages` — nouvelles conversations et messages se mettent à jour live
- **Accusé de lecture** : "Vu" affiché sous le dernier message envoyé s'il a été lu
- **Signalement** : bouton 🚩 (hover) sur les messages reçus — insert dans table `reports`
- **GitHub auto-sync** : `updateProfile()` déclenche automatiquement l'Edge Function si `github_url` est présent
- **SEO** : `index.html` avec title, description, keywords, og:*, twitter:* et canonical
- **TypeScript** : `tsc --noEmit` sans erreur après toutes les modifications

**Fichiers créés/modifiés :**
`supabase/migrations/20260524120000_add_last_seen_reports.sql`, `src/hooks/use-platform-stats.ts`, `src/types/index.ts`, `src/store/auth-store.ts`, `src/lib/profile-service.ts`, `src/pages/login-page.tsx`, `src/pages/about-page.tsx`, `src/pages/matching-page.tsx`, `src/pages/messages-page.tsx`, `src/components/profile/profile-card.tsx`, `index.html`

---

## 2026-05-24 — Session d'initialisation et analyse

**Réalisé :**
- Création du `CLAUDE.md` documentant l'architecture du projet
- Analyse graphify complète : 653 nœuds, 1287 arêtes, 38 communautés détectées
- Revue produit complète avec 10 profils virtuels (4 utilisateurs lambda + 6 experts)
- Identification des 5 améliorations prioritaires

**Découvertes clés :**
- `cn()` est le nœud le plus connecté du projet (269 arêtes) — fonction utilitaire Tailwind critique
- `useAuthStore` est consommé par 27 composants dont certains inattendus (HeroSection, Toaster)
- L'Edge Function de synchronisation GitHub n'est pas déclenchée automatiquement
- Zéro test dans le projet entier

**Décisions prises :**
- Les notifications email sont la priorité absolue (sans elles, la messagerie est inutile)
- Le score de matching numérique doit être remplacé par des raisons textuelles

**Problèmes rencontrés :**
- Clé API LangRouter expirée (erreur 401) — `lc` indisponible
- Gemini CLI en mode interactif uniquement dans ce contexte

---

## À venir

- Implémenter les notifications email (session suivante)
- Configurer le cron Supabase pour la sync GitHub
- Ajouter le champ `last_seen_at` sur les profils

---

## Voix Gemini CLI (Gemini 2.5) — 2026-05-24

*Analyse stratégique produit, perspective "LinkedIn hyperlocal"*

**Ce que Gemini a apporté en plus des 10 agents virtuels :**

- **Job & Gig Board local** : les plateformes communautaires sans débouchés économiques restent des gadgets. Les développeurs reviennent quand il y a des opportunités concrètes.
- **Cartographier les entités, pas que les individus** : startups, incubateurs (Yekolab), écoles, espaces de coworking — l'écosystème a besoin de ses structures visibles sur la carte.
- **Endorsements / recommandations** : n'importe qui peut se déclarer "Senior". La validation communautaire entre pairs crée de la crédibilité réelle.
- **Risque "Brain Drain"** : TechMapCongo peut involontairement servir de vivier de recrutement à l'étranger au détriment de l'économie locale. À surveiller.
- **Monétisation identifiée** : gratuit pour les talents, payant pour les recruteurs (accès aux filtres avancés + offres sponsorisées).
- **Vision à 1 an** : "l'infrastructure de confiance de l'économie numérique au Congo" — pas juste une carte, mais la donnée qui permet de créer une académie pour former sur les métiers en pénurie.

**Indicateurs cibles suggérés par Gemini :**
- 500+ talents actifs
- 50+ entités cartographiées (startups, écoles, incubateurs)
- 100+ mises en relation réussies documentées

---

## LangCLI (DeepSeek via LangRouter) — indisponible

**Cause** : Clé API LangRouter expirée (erreur 401).
**Action requise** : Renouveler le token dans `~/.claude/AI_WORKFLOW.md` — ligne `ANTHROPIC_AUTH_TOKEN`.

---

## Voix LangCLI (Claude via OAuth) — 2026-05-24

*Analyse produit la plus approfondie — a lu le code source réel*

**Angles nouveaux apportés par LangCLI (absents des autres revues) :**

- **Stats hardcodées = bombe à retardement** : "2 400+ développeurs" sur la page login, métriques admin, graphique de croissance, technos tendances — tout est en dur. Pour une communauté tech, c'est la pire façon de perdre sa crédibilité.
- **Modération = urgence absolue** : pas de bouton "signaler", pas de blocage d'utilisateur. Sur un petit marché où tout le monde se connaît, un incident non traité peut tuer la plateforme.
- **Landing page SEO inexistante** : la carte n'est pas indexable par Google. Zéro visiteurs organiques. Pour une communauté africaine, le bouche-à-oreille numérique passe par les moteurs de recherche.
- **WhatsApp comme option d'auth** : au Congo, WhatsApp est LE réseau. Le magic link email est bien, mais WhatsApp serait plus naturel pour une adoption large.
- **Repos GitHub = coquille vide** : la table `repositories` existe en base mais rien n'est synchronisé ni affiché. Un profil dev sans code = CV sans expérience.

**Roadmap proposée par LangCLI (3 piliers) :**
1. *3 mois* — Annuaire vivant : sync GitHub réelle, profils enrichis, landing SEO
2. *6 mois* — Opportunités : projets collaboratifs réels, board Jobs
3. *12 mois* — Communauté vivante : fil d'actualité, événements, badges, newsletter

**Métriques cibles suggérées à 1 an :**
- 500 profils réels vérifiés (pas "2 400+" factice)
- 50 projets collaboratifs lancés
- 15 événements organisés via la plateforme
- 3 entreprises qui publient des offres
