# BisoMapTech 🗺️

> Qui fait l'informatique au Congo ?

Une carte interactive et open source qui recense et connecte la communauté informatique du Congo : développeurs, administrateurs systèmes & réseaux, professionnels de la cybersécurité, data, devops, support, design et plus encore.

![Aperçu](./screenshots/preview.png)

---

## 🎯 À propos

**BisoMapTech** vise à cartographier l'ensemble de l'écosystème informatique congolais sur une carte interactive, ville par ville et métier par métier.

### Pourquoi ce projet ?

- **Visibilité** — Rendre visible la richesse de notre écosystème tech.
- **Connexion** — Faciliter les rencontres et les collaborations entre informaticiens.
- **Représentation** — Montrer que la tech au Congo ne se limite pas à Brazzaville.
- **Inspiration** — Inspirer la prochaine génération de professionnels de l'informatique.

---

## ✨ Fonctionnalités

- Carte interactive propulsée par Leaflet
- Filtres par ville, par domaine et par stack technique
- Profils des contributeurs avec lien vers leur GitHub
- Mode clair / sombre
- Interface responsive (mobile, tablette, desktop)
- Performances optimales grâce à Next.js

---

## 🛠️ Stack technique

| Élément | Technologie |
| --- | --- |
| Framework | Next.js 14 + TypeScript |
| Styling | TailwindCSS |
| Carte | React Leaflet |
| Déploiement | Netlify |

> Le projet ne nécessite **aucune base de données ni backend**. Les données des contributeurs sont stockées sous forme de fichiers JSON dans le dépôt et agrégées automatiquement au moment du build.

---

## 🚀 Installation & lancement

### Prérequis

- Node.js 18 ou supérieur
- npm ou yarn

### Étapes

```bash
# Cloner le dépôt
git clone https://github.com/KalelDAMBA/BisoMapTech.git
cd BisoMapTech

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

Ouvre ensuite [http://localhost:3000](http://localhost:3000) dans ton navigateur.

---

## 🫱🏾‍🫲🏾 Comment contribuer

Toutes les contributions sont les bienvenues, quel que soit ton métier dans l'informatique.

1. **Fork** ce dépôt.
2. Ouvre le dossier `data/contributors`.
3. Crée un nouveau fichier JSON nommé d'après ton username GitHub (ex. `monpseudo.json`).
4. Renseigne tes informations en suivant ce format :

```json
{
  "name": "Ton Nom",
  "city": "Ta Ville",
  "role": "Administrateur Systèmes & Réseaux",
  "stack": ["Linux", "Windows Server", "Cisco", "Docker"],
  "github": "https://github.com/username",
  "lat": -4.2634,
  "lng": 15.2429
}
```

5. Crée une **Pull Request** avec le titre : `feat: add [Ton Nom] from [Ta Ville]`

### Domaines disponibles (`role`)

Choisis celui qui te correspond le mieux :

`Développement` · `Systèmes & Réseaux` · `Cybersécurité` · `Data / IA` · `DevOps / Cloud` · `Support / Helpdesk` · `Design / UX` · `Hardware / Électronique` · `Gestion de projet / Product` · `Enseignement / Formation` · `No-code / Automatisation` · `Autre`

### 🔒 Sécurité & vie privée

- ✅ Utilise les coordonnées du **centre de ta ville** ou d'un **point de repère public** (monument, place, mairie).
- ❌ N'indique **jamais** ton adresse personnelle ni celle de ton lieu de travail.
- ⚠️ N'utilise pas les coordonnées (`lat` / `lng`) d'un autre contributeur.

> 💡 Astuce : utilise [gps-coordinates.net](https://www.gps-coordinates.net) pour trouver les coordonnées de ta ville.

#### Exemples de coordonnées sûres (Congo-Brazzaville)

| Ville | Département | Latitude | Longitude |
| --- | --- | --- | --- |
| Brazzaville | Brazzaville | -4.2634 | 15.2429 |
| Pointe-Noire | Pointe-Noire | -4.7889 | 11.8653 |
| Dolisie | Niari | -4.1995 | 12.6667 |
| Nkayi | Bouenza | -4.1842 | 13.2883 |
| Madingou | Bouenza | -4.1550 | 13.5500 |
| Mossendjo | Niari | -2.9453 | 12.7156 |
| Djambala | Plateaux | -2.5400 | 14.7519 |
| Ngo | Plateaux | -2.4847 | 15.7469 |
| Gamboma | Plateaux | -1.8764 | 15.8644 |
| Owando | Cuvette | -0.4819 | 15.9000 |
| Makoua | Cuvette | 0.0069 | 15.6333 |
| Ouesso | Sangha | 1.6136 | 16.0517 |
| Impfondo | Likouala | 1.6186 | 18.0622 |

Consulte le [Guide de contribution](./CONTRIBUTING.md) pour plus de détails.

Un grand merci à tous ceux qui font vivre ce projet ❤️

---

## 📜 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](./LICENSE) pour plus de détails.
