---
name: steward
description: Traitement des revues automatiques et de la CI sur les pull requests de BisoMapTech.
---

# Traitement des revues de PR — BisoMapTech

Ce dépôt fait relire chaque pull request par un bot (`.github/workflows/gemini-review.yml`,
script `scripts/gemini-pr-review.js`). Il publie en français, sous l'identité
`github-actions[bot]`, à l'ouverture de la PR et à chaque nouveau commit poussé.

**Règle du dépôt : aucune revue de ce bot ne reste sans traitement.** Chaque revue
est lue, chaque constat est tranché, et la décision est visible sur la PR.

## Ce que ce bot voit, et ce qu'il ne voit pas

Le script ne lui transmet que le **diff**, tronqué à 200 000 caractères. Il ne
reçoit jamais les fichiers complets ni l'arborescence.

Conséquence observée à plusieurs reprises : quand le contexte lui manque, **il
l'invente**. Il a déjà cité des fichiers qui n'ont jamais existé dans ce dépôt
(`dashboard.tsx`, `useMapInteraction.ts`), des symboles absents
(`profilesInView`, `markerGroupRef`, `onBoundsChangeRef`) et du code jamais
écrit (`JSON.stringify(profiles)` comme détection de changement). Le fond de ces
remarques était parfois juste, mais la cible était fausse.

**Donc : ne jamais appliquer un correctif de ce bot sans avoir vérifié la cible
dans le code réel.** Un `grep` ou une lecture du fichier suffit et prend dix
secondes.

## Marche à suivre à chaque revue

1. **Vérifier avant de croire.** Pour chaque constat : le fichier existe-t-il ?
   le symbole existe-t-il ? le code décrit correspond-il à ce qui est écrit ?
2. **Trancher chaque constat** dans une de ces trois cases :
   - *fondé* → corriger, valider, pousser ;
   - *déjà satisfait* → le dire en une ligne, sans modifier le code ;
   - *sans objet* (cible inexistante, ou coût supérieur au gain) → le dire en une
     ligne avec la raison.
3. **Valider avant de pousser** : `npm run build` puis `npm test`. Un correctif
   qui casse la CI coûte plus cher que le constat qu'il traite.
4. **Répondre une fois par revue**, en un seul commentaire sur la PR : ce qui a
   été appliqué (avec le SHA), ce qui a été écarté et pourquoi. Pas un
   commentaire par constat.
5. **Consigner les décisions structurantes** dans `decisions.md`, à côté de ce
   fichier, pour qu'une session suivante ne rejuge pas le même point.

## Critères de tri propres au projet

- **Aucune dépendance ajoutée sans gain démontré.** Les utilisateurs sont sur
  forfait mobile limité et téléphones d'entrée de gamme. Un paquet de plus dans
  le bundle se paie en mégaoctets à chaque visite. Le bot suggère régulièrement
  des bibliothèques pour des problèmes que le code traite déjà.
- **XSS : vérifier le chemin de rendu avant de désinfecter.** React échappe le
  texte rendu en JSX. Le seul HTML construit à la main dans ce dépôt est celui
  des bulles Leaflet (`congo-map.tsx`, `places-map.tsx`) et de la fonction
  `api/share-preview.ts`, et les trois passent par un échappement explicite.
- **Pas de données inventées.** Ce dépôt a été purgé de ses jeux de données
  fictives : un écran vide affiche un état vide honnête, jamais un contenu
  fabriqué. Refuser toute suggestion qui réintroduirait un repli sur des données
  factices.
- **Ne pas élargir la PR.** Un constat fondé mais hors du périmètre de la branche
  se traite dans une PR dédiée, annoncée en commentaire.

## Faire évoluer le bot lui-même

Quand une revue se trompe de façon répétée, la correction durable est dans le
prompt de `scripts/gemini-pr-review.js`, pas dans un rappel ponctuel. Les règles
qui y figurent aujourd'hui viennent de ces erreurs observées : interdiction de
citer un fichier absent du diff, obligation de dire « non vérifiable depuis le
diff », contraintes de bande passante, rappel sur l'échappement JSX.

Toute nouvelle dérive constatée s'y ajoute, et le motif est noté dans
`decisions.md`.
