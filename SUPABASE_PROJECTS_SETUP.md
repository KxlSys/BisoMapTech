# Mise en place de la table `projects` — BisoMapTech

## Contexte

La page `/matching` du projet BisoMapTech affiche des projets tech congolais et les met en relation avec les talents disponibles. Le frontend est déjà prêt et tourne avec des données fictives en attendant que cette table existe dans Supabase. Une fois les étapes ci-dessous effectuées, les vraies données s'afficheront automatiquement.

---

## 1. Créer la table

Dans l'éditeur SQL de Supabase (**SQL Editor → New Query**), coller et exécuter :

```sql
create table public.projects (
  id               uuid        primary key default gen_random_uuid(),
  title            text        not null,
  description      text        not null,
  tech_stack       text[]      not null default '{}',
  budget           text,
  duration         text,
  collab_mode      text,
  open_to_collaboration boolean not null default true,
  location         text,
  project_type     text        check (project_type in ('Startup', 'Public', 'ONG', 'Personnel')),
  priority         text,
  author_id        uuid        not null references public.profiles(id) on delete cascade,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
```

> **Note :** La colonne `author_id` référence la table `profiles` déjà existante. La suppression d'un profil entraîne la suppression en cascade de ses projets.

---

## 2. Activer la sécurité (RLS)

```sql
-- Activer Row Level Security
alter table public.projects enable row level security;

-- Tout le monde peut lire les projets ouverts à la collaboration
create policy "Projets visibles publiquement"
  on public.projects for select
  using (open_to_collaboration = true);

-- Seul l'auteur peut créer un projet
create policy "Auteur peut créer"
  on public.projects for insert
  with check (auth.uid() = author_id);

-- Seul l'auteur peut modifier son projet
create policy "Auteur peut modifier"
  on public.projects for update
  using (auth.uid() = author_id);

-- Seul l'auteur peut supprimer son projet
create policy "Auteur peut supprimer"
  on public.projects for delete
  using (auth.uid() = author_id);
```

---

## 3. Créer les index

Pour que les requêtes restent rapides même avec beaucoup de projets :

```sql
create index on public.projects (author_id);
create index on public.projects (open_to_collaboration, created_at desc);
```

---

## 4. Mise à jour automatique de `updated_at`

Activer d'abord l'extension si elle ne l'est pas déjà (**Database → Extensions → moddatetime**), puis :

```sql
create trigger set_projects_updated_at
  before update on public.projects
  for each row
  execute procedure moddatetime(updated_at);
```

---

## 5. Vérification

Après exécution, vérifier dans **Table Editor** que :

- La table `projects` apparaît bien
- Les colonnes correspondent au schéma ci-dessus
- RLS est activé (cadenas fermé visible dans l'interface)

Pour tester rapidement avec une ligne :

```sql
-- Insérer un projet de test (remplacer l'UUID par un vrai author_id depuis profiles)
insert into public.projects (title, description, tech_stack, open_to_collaboration, author_id)
values (
  'Projet de test',
  'Description du projet de test.',
  array['React', 'TypeScript'],
  true,
  (select id from public.profiles limit 1)
);

-- Vérifier que la ligne est visible
select * from public.projects;
```

---

## Ce que ça débloque côté frontend

Une fois la table créée, **aucun changement de code n'est nécessaire**. Le service `src/lib/project-service.ts` tente automatiquement de charger les projets depuis Supabase et bascule sur les données fictives seulement si la table est absente ou vide. Dès que des projets sont insérés, ils apparaissent dans l'onglet **Projets** de `/matching`.

La jointure suivante est déjà câblée dans le frontend pour afficher l'auteur de chaque projet :

```
profiles!projects_author_id_fkey(id, username, full_name, avatar_url)
```

---

## Résumé des étapes

| Étape | Action | Obligatoire |
|-------|--------|-------------|
| 1 | Créer la table `projects` | ✅ Oui |
| 2 | Activer RLS + politiques | ✅ Oui |
| 3 | Créer les index | Recommandé |
| 4 | Trigger `updated_at` | Recommandé |
| 5 | Vérification / test | Conseillé |
