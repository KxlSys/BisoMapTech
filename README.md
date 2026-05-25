<div align="center">

# BisoMapTech

**La carte interactive de la communauté tech au Congo.**

[![Stack](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](#licence)

</div>

---

## Sommaire

- [À propos](#à-propos)
- [Fonctionnalités](#fonctionnalités)
- [Stack technique](#stack-technique)
- [Architecture](#architecture)
- [Démarrage rapide](#démarrage-rapide)
- [Variables d'environnement](#variables-denvironnement)
- [Scripts disponibles](#scripts-disponibles)
- [Contribution](#contribution)
- [Sécurité & vie privée](#sécurité--vie-privée)
- [Feuille de route](#feuille-de-route)
- [Licence](#licence)

---

## À propos

**BisoMapTech** est une plateforme open source qui cartographie et connecte la
communauté informatique de la République du Congo : développeurs,
administrateurs systèmes & réseaux, professionnels de la cybersécurité, data,
DevOps, support, design, hardware, formation et bien plus.

L'objectif est triple :

- **Visibilité** — rendre lisible la richesse de l'écosystème tech congolais.
- **Connexion** — favoriser les rencontres, le mentorat et les collaborations.
- **Représentation** — montrer que la tech au Congo ne se limite pas à
  Brazzaville, et inspirer les générations qui arrivent.

---

## Fonctionnalités

- Carte interactive (Leaflet) des contributeurs et des lieux tech du Congo
- Profils détaillés avec compétences, stack, projets et liens GitHub
- Authentification et gestion de session via Supabase Auth
- Recherche et filtres par ville, métier, technologie
- Module de matching pour faciliter les mises en relation
- Messagerie interne entre membres
- Pages dédiées aux lieux (espaces de coworking, écoles, communautés…)
- Synchronisation automatique des dépôts GitHub d'un profil
- Notifications par e-mail sur nouveaux messages
- Espace d'administration pour la modération
- Mode clair / sombre, interface responsive, optimisée mobile

---

## Stack technique

| Domaine            | Technologie                                  |
| ------------------ | -------------------------------------------- |
| Build / Dev server | Vite 7                                       |
| Framework UI       | React 19 + TypeScript                        |
| Routing            | React Router 6                               |
| Styling            | Tailwind CSS 4 + shadcn/ui (Radix UI)        |
| State management   | Zustand                                      |
| Formulaires        | React Hook Form + Zod                        |
| Carte              | Leaflet + React Leaflet                      |
| Graphiques         | Recharts                                     |
| Backend            | Supabase (PostgreSQL, Auth, Edge Functions)  |
| Tests              | Vitest                                       |
| Déploiement        | Vercel                                       |

---

## Architecture

```
BisoMapTech/
├── public/                # Assets statiques
├── src/
│   ├── components/        # Composants UI (carte, filtres, layout, profil, ui…)
│   ├── pages/             # Pages applicatives (home, map, profile, messages…)
│   ├── hooks/             # Hooks React partagés
│   ├── lib/               # Clients (Supabase) et utilitaires
│   ├── store/             # Stores Zustand
│   ├── types/             # Types TypeScript partagés
│   ├── App.tsx            # Routes de l'application
│   └── main.tsx           # Point d'entrée Vite
├── supabase/
│   ├── migrations/        # Schéma SQL versionné
│   └── functions/         # Edge Functions (notifications, sync GitHub)
├── index.html             # Template Vite
├── vite.config.ts         # Configuration Vite
└── vercel.json            # Configuration de déploiement Vercel
```

---

## Démarrage rapide

### Prérequis

- **Node.js 20 ou supérieur** (Vite 7 requiert Node ≥ 20.19)
- **npm** (ou pnpm / yarn / bun)
- Un projet **Supabase** (gratuit) pour l'authentification et la base de données

### Installation

```bash
# 1. Cloner le dépôt
git clone https://github.com/KalelDAMBA/BisoMapTech.git
cd BisoMapTech

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env.local
# puis renseigner VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY

# 4. Lancer le serveur de développement
npm run dev
```

L'application est ensuite disponible sur
[http://localhost:5173](http://localhost:5173).

### Mise en place de la base Supabase

Le dossier `supabase/migrations/` contient le schéma SQL versionné. Pour
appliquer les migrations sur votre projet Supabase, le plus simple est
d'utiliser la [CLI officielle](https://supabase.com/docs/guides/cli) :

```bash
supabase link --project-ref <votre_project_ref>
supabase db push
```

Les Edge Functions situées dans `supabase/functions/` peuvent être déployées
avec :

```bash
supabase functions deploy send-message-notification
supabase functions deploy sync-github-repos
```

---

## Variables d'environnement

Les variables sont chargées par Vite (préfixe `VITE_` requis pour exposition
côté client). Voir `.env.example` pour la liste à jour.

| Variable                  | Obligatoire | Description                            |
| ------------------------- | :---------: | -------------------------------------- |
| `VITE_SUPABASE_URL`       | oui         | URL du projet Supabase                 |
| `VITE_SUPABASE_ANON_KEY`  | oui         | Clé publique (anon) du projet Supabase |

> Ne committez jamais vos clés. Le fichier `.env.local` est ignoré par Git.

---

## Scripts disponibles

| Commande            | Description                                     |
| ------------------- | ----------------------------------------------- |
| `npm run dev`       | Démarre le serveur de développement Vite        |
| `npm run build`     | Vérifie les types et génère la build de prod    |
| `npm run preview`   | Sert localement la build de production          |
| `npm run typecheck` | Vérifie uniquement les types TypeScript         |
| `npm run test`      | Exécute la suite de tests Vitest                |

---

## Contribution

Toutes les contributions sont les bienvenues, quel que soit votre métier dans
l'informatique. Plusieurs façons de participer :

### Ajouter votre profil sur la carte

L'ajout de profil se fait directement depuis l'application :

1. Rendez-vous sur l'instance déployée (ou votre instance locale).
2. Créez un compte via la page **Connexion**.
3. Suivez le parcours d'**onboarding** pour renseigner votre métier, votre
   stack, votre ville et un point de localisation public.
4. Votre profil apparaît sur la carte une fois publié.

### Contribuer au code

1. **Forkez** le dépôt et créez une branche depuis `main` :
   `git checkout -b feat/ma-fonctionnalite`.
2. Respectez la structure des dossiers et le style de code existant
   (TypeScript strict, composants fonctionnels, Tailwind utility-first).
3. Vérifiez la build et les tests avant de pousser :

   ```bash
   npm run typecheck
   npm run build
   npm run test
   ```

4. Ouvrez une **Pull Request** avec un titre clair au format Conventional
   Commits (`feat:`, `fix:`, `docs:`, `refactor:`…).

### Domaines couverts

`Développement` · `Systèmes & Réseaux` · `Cybersécurité` · `Data / IA` ·
`DevOps / Cloud` · `Support / Helpdesk` · `Design / UX` ·
`Hardware / Électronique` · `Gestion de projet / Product` ·
`Enseignement / Formation` · `No-code / Automatisation` · `Autre`

---

## Sécurité & vie privée

Pour protéger les contributeurs, quelques règles strictes s'appliquent à toute
donnée de localisation publiée sur la carte :

- Utilisez les coordonnées du **centre de votre ville** ou d'un **point de
  repère public** (mairie, place, monument, université).
- N'indiquez **jamais** votre adresse personnelle ni celle de votre employeur.
- Ne réutilisez pas les coordonnées d'un autre contributeur.

> Astuce : [gps-coordinates.net](https://www.gps-coordinates.net) permet de
> trouver rapidement les coordonnées d'un point public.

### Exemples de coordonnées sûres (Congo-Brazzaville)

| Ville        | Département   |  Latitude |  Longitude |
| ------------ | ------------- | --------: | ---------: |
| Brazzaville  | Brazzaville   |   -4.2634 |    15.2429 |
| Pointe-Noire | Pointe-Noire  |   -4.7889 |    11.8653 |
| Dolisie      | Niari         |   -4.1995 |    12.6667 |
| Nkayi        | Bouenza       |   -4.1842 |    13.2883 |
| Madingou     | Bouenza       |   -4.1550 |    13.5500 |
| Mossendjo    | Niari         |   -2.9453 |    12.7156 |
| Djambala     | Plateaux      |   -2.5400 |    14.7519 |
| Ngo          | Plateaux      |   -2.4847 |    15.7469 |
| Gamboma      | Plateaux      |   -1.8764 |    15.8644 |
| Owando       | Cuvette       |   -0.4819 |    15.9000 |
| Makoua       | Cuvette       |    0.0069 |    15.6333 |
| Ouesso       | Sangha        |    1.6136 |    16.0517 |
| Impfondo     | Likouala      |    1.6186 |    18.0622 |

Pour signaler une vulnérabilité ou un comportement abusif, contactez les
mainteneurs en privé via une *issue* GitHub marquée `security`.

---

## Feuille de route

- [ ] Documentation publique de l'API Supabase (RLS, tables, vues)
- [ ] Internationalisation (FR / EN / Lingala)
- [ ] Application mobile (PWA puis natif)
- [ ] Statistiques publiques de l'écosystème tech congolais
- [ ] Annuaire des entreprises et structures tech
- [ ] Programme de mentorat intégré

Les suggestions sont les bienvenues : ouvrez une *issue* pour en discuter.

---

## Licence

Distribué sous licence **MIT**. Vous êtes libre d'utiliser, modifier et
redistribuer ce projet en conservant la mention de copyright d'origine.

---

<div align="center">

Fait avec ❤️ par et pour la communauté tech congolaise.

</div>
