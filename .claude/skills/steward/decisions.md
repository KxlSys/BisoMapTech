# Constats de revue déjà tranchés

Journal des décisions prises sur les revues automatiques, pour ne pas rejuger
deux fois le même point. Le plus récent en haut.

Format : constat, verdict, raison, référence.

---

## Le journal nourrit la revue

Observation sur la revue de `ec88d44` : deux constats (la liste figée de
`PROFILE_FIELDS`, la chaîne de repli des variables d'environnement) citent
explicitement les justifications de ce fichier et les acceptent, au lieu de les
soulever à nouveau comme des problèmes.

`decisions.md` fait partie du diff quand il change, donc le bot le lit. Tenir ce
journal à jour réduit mécaniquement le bruit des revues suivantes : un
compromis écrit et motivé n'est plus re-signalé. Raison de plus pour y consigner
les arbitrages plutôt que de les laisser dans un fil de conversation.

Inexactitude résiduelle du même passage : la revue écrit « `package-lock.json`
(supprimé) » alors que c'est `pnpm-lock.yaml` qui a été supprimé. Le prompt
durci a supprimé les fichiers inventés, pas toutes les imprécisions de lecture.
La vérification avant correction reste la protection réelle.

---

## La boucle de revue est stabilisée

Première revue produite avec le prompt durci *et* le script résistant : six
constats, tous verts, chacun rattaché à un fichier et à des numéros de ligne,
aucun fichier inventé, aucune fausse alerte en sévérité haute. Le seul point de
fond est une remarque tiède sur `PROFILE_FIELDS`, qui couple la fonction edge au
schéma de `profiles`.

**Verdict sur `PROFILE_FIELDS` : écarté.** Lister les colonnes est délibéré.
Les découvrir à l'exécution coûterait une requête de schéma supplémentaire à
chaque aperçu, sur un chemin qui doit répondre en moins de 2,5 secondes à un
robot. Le couplage est le prix, assumé, d'une requête minimale.

Rien d'autre à faire. Aucune réponse publiée : une revue entièrement verte
encombrerait la PR sans rien apprendre à un relecteur humain.

---

## Le job de revue ne doit pas bloquer une PR

Le job `review` a échoué sur `ecbd386` : l'API Gemini a renvoyé 503 « forte
demande ». Panne passagère en amont, sans rapport avec le diff.

Traité à la source plutôt que par une relance : le script réessaie jusqu'à
quatre fois avec un délai croissant sur les erreurs passagères (429, 5xx, échec
réseau), et sort en succès si le modèle reste muet. Une revue est un avis, pas
une porte : un modèle surchargé ne doit pas faire échouer la CI d'une PR saine.

Si ce job réapparaît en rouge, lire le journal du job avant de relancer : une
erreur non passagère (400, clé invalide) sort désormais sans réessai et le
message le dit.

---

## Effet du durcissement du prompt — observé

La première revue produite après `c995a3e` est nettement différente des
précédentes : chaque constat porte un chemin de fichier et des numéros de ligne,
la formule imposée « Non vérifiable depuis le diff » est employée là où le
contexte manque, le format est compact et aucun fichier inexistant n'est cité.

Les inventions récurrentes venaient donc bien du prompt, pas du modèle. Si une
nouvelle forme de dérive apparaît, la corriger d'abord dans
`scripts/gemini-pr-review.js`.

---

## PR #497 — revue de la fonction de partage

### `npm ci` au lieu de `npm install` en CI
**Verdict : fondé, corrigé**

La suggestion a révélé un vrai défaut, introduit par le commit précédent :
`npm ci` échouait, `react-is@19.3.0` manquait au verrou. La régénération avec
`--legacy-peer-deps` avait sauté la résolution des dépendances de pair. Comme la
CI installait avec `npm install`, elle re-résolvait en silence et rien ne
cassait : le verrou n'était pas la source de vérité. Verrou régénéré sans
`--legacy-peer-deps`, `npm ci` vérifié, les deux workflows l'utilisent désormais.

**Leçon à retenir : ne jamais régénérer ce verrou avec `--legacy-peer-deps`.**

### Dépendance aux politiques RLS de `profiles`
**Verdict : fondé sur le principe, sévérité surévaluée — documenté**

Vérifié dans `supabase/migrations/20260523234142_...sql` : la politique est
`Anyone can view profiles ... TO anon, authenticated USING (true)`, en lecture
seule, sur une table qui ne contient que des champs d'annuaire public. Aucun
e-mail, téléphone ni donnée d'authentification. L'application lit déjà cette
table avec la même clé depuis le navigateur : la fonction edge n'expose rien de
neuf. Dépendance documentée dans `api/share-preview.ts`.

### Test XSS au niveau du gestionnaire
**Verdict : fondé, ajouté**

L'échappement était déjà testé dans `page-meta.test.ts`, mais pas le chemin
complet du gestionnaire. Test ajouté avec un profil hostile.

### Retirer l'en-tête `Authorization` de l'appel Supabase
**Verdict : écarté**

`apikey` identifie le projet auprès de la passerelle, `Authorization` fixe le
rôle Postgres utilisé par PostgREST. supabase-js envoie les deux. Retirer le
second risque de casser la résolution du rôle. Raison inscrite en commentaire.

### Simplifier la chaîne de repli des variables d'environnement
**Verdict : écarté**

Elle suit `.env.example` et `src/lib/supabase.ts` : selon l'âge du projet
Supabase, la clé publique s'appelle « anon » ou « publishable ». La raccourcir
casserait les déploiements qui utilisent le second nom. Commentaire ajouté.

---

## PR #497 — septembre 2026

### Gestion des marqueurs recréés à chaque changement de `profiles`
**Verdict : fondé, corrigé** (`8da1de1`)

L'effet vidait le groupe de grappes et recréait les 200 marqueurs à chaque
changement de la liste. Remplacé par une synchronisation incrémentale :
comparaison de l'état affiché à l'état demandé, ajouts et retraits groupés,
mise à jour d'un marqueur existant seulement si sa position, son drapeau de
collaboration ou l'empreinte de sa bulle a changé.

Mesuré au navigateur avec un compteur temporaire : charger 12 profils, filtrer
sur un métier, revenir à tous donnait 36 créations de marqueurs, contre 18
après correction.

### `useMemo` sur `profilesInView` dans `dashboard.tsx`
**Verdict : sans objet**

Ni le fichier ni le symbole n'existent. L'équivalent réel est `visibleProfiles`
dans `src/pages/map-page.tsx`, déjà mémoïsé sur `[listProfiles, searchInArea,
mapBounds]`.

### Dépendances des `useCallback` dans `useMapInteraction.ts`
**Verdict : sans objet**

Le fichier n'existe pas. Les callbacks d'interaction carte sont dans
`map-page.tsx` (`handleMapReady`, `handleBoundsChange`, `handleProfileHover`,
`handleProfileClick`), toutes en `useCallback` avec un tableau de dépendances
vide, donc déjà maximalement stables.

### `JSON.stringify(profiles)` comme détection de changement
**Verdict : sans objet**

Cette expression n'a jamais figuré dans le dépôt.

### Désinfection HTML des champs importés de GitHub (DOMPurify)
**Verdict : écarté, avec raison**

`full_name` et `bio` alimentent des champs de formulaire puis du texte JSX, que
React échappe. Le seul HTML construit à la main est celui des bulles Leaflet,
qui passe par `escapeHtml()`. Ajouter une dépendance pour protéger un chemin
inexistant coûte du bundle sans contrepartie.

### Proxy de l'API GitHub par une fonction edge avec jeton
**Verdict : écarté pour cette PR, à reconsidérer**

L'import GitHub est une action ponctuelle à l'inscription, pas un appel
récurrent ; la limite de 60 requêtes par heure et par IP laisse de la marge, et
l'erreur de quota est déjà gérée avec un message explicite. À reprendre dans une
PR dédiée si le taux d'échec devient visible.

### Typage du drapeau de collaboration porté par les marqueurs
**Verdict : fondé, corrigé** (`6f69376`)

`(marker as any)._isCollaborating` remplacé par un type `ProfileMarker`
explicite, clé renommée `bisoIsCollaborating` pour écarter tout risque de
collision avec les champs internes de Leaflet.

### Annulation des requêtes d'import GitHub
**Verdict : fondé, corrigé** (`126d22a`)

`AbortController` branché sur l'import, annulé au démontage et à chaque nouvel
import.

### Attribut `type` explicite sur les boutons de formulaire
**Verdict : déjà satisfait**

Vérifié sur les quatre fichiers contenant un `<form>` : aucun bouton sans `type`
explicite à l'intérieur d'un formulaire.

### Couverture de tests mesurée (`vitest --coverage`)
**Verdict : proposé, non fait**

Demande l'ajout de `@vitest/coverage-v8`. À arbitrer : utile, mais c'est une
dépendance de plus et du temps de CI. Non bloquant.
