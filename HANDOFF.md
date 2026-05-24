# HANDOFF.md — TechMapCongo

> Dernière mise à jour : 2026-05-24 (session 2)
> Ce fichier décrit l'état actuel du projet pour toute personne qui reprend le travail.

---

## C'est quoi ce projet ?

TechMapCongo est une application web qui cartographie la communauté tech du Congo-Brazzaville. Les développeurs créent un profil, se géolocalisent sur une carte interactive, et peuvent se connecter via un système de matching et une messagerie intégrée.

**Stack** : React 19 + TypeScript + Vite + Tailwind CSS v4 + Supabase + Zustand + react-leaflet

---

## État actuel (mai 2026)

### ✅ Ce qui est fait et fonctionne

- Carte interactive du Congo avec marqueurs géolocalisés par ville
- Authentification GitHub OAuth + magic link email
- Création et édition de profil complet (bio, compétences, ville, GitHub)
- Liste paginée des contributeurs avec filtres (ville, rôle, niveau, techs, collaboration)
- Système de matching avec score + raisons textuelles en chips colorés
- Messagerie temps réel (Supabase Realtime) entre utilisateurs
- Accusé de lecture "Vu" sur le dernier message envoyé
- Bouton de signalement (🚩) sur les messages — table `reports` + RLS admin
- Indicateur d'activité `last_seen_at` sur les profils (point vert / "il y a Xh")
- Stats réelles sur login et about page (depuis Supabase, pas hardcodées)
- About page entièrement data-driven (rôles, techs, villes, inscriptions/mois)
- Espace admin (gestion des profils, invitations admin)
- Onboarding guidé en plusieurs étapes
- Mode sombre / clair
- Base de données Supabase avec RLS sur toutes les tables
- Edge Function GitHub sync — déclenchée automatiquement lors de `updateProfile()`
- SEO complet : title, description, og:*, twitter:*, canonical, lang="fr"
- Migration SQL : `last_seen_at` sur profiles + table `reports`

### ❌ Ce qui ne fonctionne pas encore

- **Notifications email** : aucune notification email quand un message est reçu
- **Tests** : zéro tests automatisés (ni unitaires, ni intégration, ni end-to-end)
- **Rate limiting** : pas de protection contre le spam de messages
- **Modération admin** : table `reports` créée, mais l'interface admin ne l'affiche pas encore

### ⚠️ Points fragiles à surveiller

- La migration `20260524120000_add_last_seen_reports.sql` doit être appliquée sur Supabase (`supabase db push`)
- Les popups de la carte sont construits en HTML pur (fragile si les données changent)
- L'onboarding perd son état si l'utilisateur rafraîchit la page en cours de route
- La clé API LangRouter dans `~/.claude/AI_WORKFLOW.md` est expirée

---

## Prochaines tâches prioritaires

1. **Notifications email** quand un message est reçu (Supabase + Resend ou SendGrid)
2. **Interface admin — modération** : afficher et gérer les signalements depuis la table `reports`
3. **Tests unitaires** sur `calculateMatches()` et `profile-service.ts`
4. **Rate limiting** sur la messagerie (Supabase Edge Function ou RLS avec cooldown)

---

## Architecture en un coup d'œil

```
Supabase DB (tables: profiles, repositories, admin_invitations, messages)
    ↕  (Row Level Security sur toutes les tables)
src/lib/profile-service.ts   ← TOUTES les requêtes DB passent ici
    ↕
src/hooks/use-filtered-profiles.ts  ← debounce 300ms + pagination
    ↕
src/store/filter-store.ts    ← filtres globaux (Zustand)
src/store/auth-store.ts      ← session, profil connecté, messages non lus
    ↕
src/pages/                   ← pages lazy-loadées
    ↕
src/components/              ← composants UI
```

**Règle d'or** : ne jamais appeler Supabase directement depuis un composant — toujours passer par `profile-service.ts`.

---

## Variables d'environnement requises

Fichier `.env.local` à créer :
```
VITE_SUPABASE_URL=<url du projet Supabase>
VITE_SUPABASE_ANON_KEY=<clé anon Supabase>
```

## Commandes

```bash
npm run dev          # Développement (port 5173)
npm run build        # Build de production
npm run typecheck    # Vérification TypeScript
```
