# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projet

**TechMap Congo** — Cartographie interactive de la communauté tech congolaise (Congo-Brazzaville). Les développeurs créent un profil, se placent sur la carte Leaflet, et peuvent se connecter via un système de matching et de messagerie.

Stack : React 19 + TypeScript + Vite + Tailwind CSS v4 + Supabase + Zustand + react-leaflet.

## Commandes

```bash
npm run dev          # Serveur de développement (port 5173)
npm run build        # Build de production (tsc -b && vite build)
npm run typecheck    # Vérification TypeScript sans emit
npm run preview      # Preview du build de production
```

## Variables d'environnement requises

Créer un fichier `.env.local` :

```
VITE_SUPABASE_URL=<url du projet Supabase>
VITE_SUPABASE_ANON_KEY=<clé anon Supabase>
```

## Architecture

### Flux de données

```
Supabase DB
    ↕  (RLS policies)
src/lib/profile-service.ts   ← toutes les requêtes DB (source unique)
    ↕
src/hooks/use-filtered-profiles.ts  ← debounce 300ms + pagination
    ↕
src/store/filter-store.ts    ← filtres globaux (Zustand, sans persistence)
src/store/auth-store.ts      ← session, profil courant, unreadMessages
    ↕
src/pages/                   ← pages lazy-loadées (React.lazy + Suspense)
    ↕
src/components/              ← UI et composants fonctionnels
```

### Stores Zustand

- **`auth-store`** : session Supabase, profil connecté, compteur de messages non lus. S'initialise via `useEffect` dans `App.tsx`.
- **`filter-store`** : critères de filtre de la page contributeurs (searchQuery, city, techStack, roleType, experienceLevel, openToCollaboration). Remis à zéro avec `resetFilters()`.

### Carte (`src/components/map/congo-map.tsx`)

Utilise Leaflet en mode impératif (refs, pas react-leaflet pour les markers). La carte est bornée au Congo-Brazzaville. Les tiles CARTO s'adaptent au thème clair/sombre. Les popups HTML sont construits manuellement avec `escapeHtml()` pour éviter l'XSS — ne jamais interpoler de données utilisateur sans cette fonction.

### Base de données (Supabase)

Tables : `profiles`, `repositories`, `admin_invitations`, `messages`. Toutes protégées par Row Level Security. Les fonctions Edge Supabase sont dans `supabase/functions/`. Les migrations SQL sont dans `supabase/migrations/`.

- Le champ `tech_stack` est un tableau PostgreSQL (`text[]`) indexé en GIN — utiliser `.overlaps()` ou `.cs.{}` pour les requêtes.
- Les rôles sont : `visitor` / `contributor` / `admin`. La promotion admin se fait via `admin_invitations`.

### Matching (`src/lib/matching.ts`)

Algorithme de scoring pur (pas de DB) basé sur : rôles complémentaires (+30), techs en commun (+10/tech, max 25), même ville (+20), niveau d'expérience compatible (+15), open_to_collaboration (+10). Score plafonné à 100.

### Routing

Toutes les routes sont dans `App.tsx`, imbriquées sous `AppLayout`. La page map (`/`) a un layout spécial sans padding (plein écran). Les autres pages ont un footer visible uniquement sur desktop.

### Alias de chemin

`@/` pointe vers `src/` (configuré dans `vite.config.ts` et `tsconfig.app.json`).

## Conventions

- Les composants UI réutilisables (shadcn/ui) sont dans `src/components/ui/`.
- Ne jamais appeler Supabase directement depuis un composant — passer par `profile-service.ts` ou le store.
- Les nouveaux types métier vont dans `src/types/index.ts`.
- Les constantes (liste de techs, labels) vont dans `src/lib/constants.ts`.
- Les villes congolaises avec coordonnées GPS sont dans `src/lib/cities.ts`.
