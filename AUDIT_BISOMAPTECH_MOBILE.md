# AUDIT BISOMAPTECH MOBILE

## Contexte de l'analyse

**Date :** 29 Mai 2026

**URL :** https://bisomaptech.vercel.app/

**Type d'analyse :** Mobile

**Conditions Lighthouse :**

- Appareil : Moto G Power (émulation)
- Réseau : 4G lente
- Première visite
- Lighthouse 13.3.0
- Headless Chromium

---

## Résultats

| Domaine          | Score |
| ---------------- | ----- |
| Performance      | 93    |
| Accessibilité    | 95    |
| Bonnes pratiques | 100   |
| SEO              | 92    |

---

## Plan de remédiation

Les optimisations suivantes ont été identifiées à partir de cet audit et
implémentées dans la même itération. Aucune modification n'altère le
comportement applicatif.

### P0 — SEO bloquant

- **`robots.txt` / fichiers statiques** : la règle de réécriture SPA
  (`/(.*) → /index.html`) renvoyait `index.html` pour tout fichier statique
  manquant. `/sitemap.xml` était référencé dans `robots.txt` mais le fichier
  n'existait pas, donc `/sitemap.xml` retournait du HTML au lieu d'un sitemap
  valide.
- **Correctifs :**
  - Création de `public/sitemap.xml` listant les pages publiques.
  - Réécriture `vercel.json` ajustée pour exclure les fichiers statiques
    (lookahead négatif sur les extensions), garantissant que `/robots.txt`,
    `/sitemap.xml` et les autres fichiers statiques soient toujours servis tels
    quels.
  - `robots.txt` complété (référence sitemap + `Disallow` des routes privées).

### P1 — JavaScript inutilisé (~127 KiB)

- Initialisation de **Sentry** déplacée hors du chemin de rendu critique
  (import dynamique déclenché à l'inactivité du navigateur). Le monitoring reste
  actif, mais le bundle Sentry ne bloque plus le premier rendu.
- Les routes et composants cartographiques (Leaflet) étaient déjà chargés en
  lazy via `React.lazy` ; vérifié et conservé.

### P1 — Ressources bloquant le rendu

- Chargement des polices Google Fonts rendu **non bloquant**
  (`preload` + `media="print"` / `onload`, repli `<noscript>`), tout en
  conservant `display=swap` et la police système en repli immédiat.

### P2 — Cibles tactiles (mobile)

- Agrandissement des cibles tactiles sous le seuil recommandé sur mobile :
  bouton de connexion et déclencheur du menu utilisateur de la barre supérieure
  mobile, lien logo, et boutons d'action de la page d'accueil.

---

## Important

Cet audit concerne exclusivement la version **Mobile**.

Les performances Desktop sont traitées dans un document séparé :

- `AUDIT_BISOMAPTECH_DESKTOP.md`
