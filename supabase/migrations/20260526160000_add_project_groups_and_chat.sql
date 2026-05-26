-- ======================================================
-- CREATE TABLES FOR PROJECT GROUP CHAT
-- ======================================================

-- 1. Create project_members table
create table if not exists public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'collaborator')),
  joined_at timestamptz not null default now(),
  primary key (project_id, profile_id)
);

-- 2. Create project_messages table
create table if not exists public.project_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- 3. Enable RLS (Row Level Security)
alter table public.project_members enable row level security;
alter table public.project_messages enable row level security;

-- ======================================================
-- SECURITY POLICIES (RLS)
-- ======================================================

-- Policies for project_members
create policy "Membres de projet visibles par tous les connectés"
  on public.project_members for select
  using (true);

create policy "Les utilisateurs authentifiés peuvent rejoindre un projet"
  on public.project_members for insert
  with check (auth.uid() = profile_id);

create policy "Les membres peuvent quitter un projet"
  on public.project_members for delete
  using (auth.uid() = profile_id);

-- Policies for project_messages
create policy "Seuls les membres du groupe de projet peuvent lire les messages"
  on public.project_messages for select
  using (
    exists (
      select 1 from public.project_members
      where project_members.project_id = project_messages.project_id
      and project_members.profile_id = auth.uid()
    )
  );

create policy "Seuls les membres du groupe de projet peuvent envoyer des messages"
  on public.project_messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.project_members
      where project_members.project_id = project_messages.project_id
      and project_members.profile_id = auth.uid()
    )
  );

-- ======================================================
-- INDEXES FOR PERFORMANCE
-- ======================================================
create index if not exists project_members_profile_idx on public.project_members (profile_id);
create index if not exists project_messages_project_idx on public.project_messages (project_id, created_at asc);
