-- VisioSpace V2 foundation: identity, collaboration boundaries, persistence, and communication.
create extension if not exists pgcrypto;

create type public.workspace_role as enum ('owner', 'admin', 'member');
create type public.board_role as enum ('viewer', 'editor');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.workspace_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table public.boards (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null default 'Untitled board',
  state jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.board_members (
  board_id uuid not null references public.boards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.board_role not null default 'viewer',
  created_at timestamptz not null default now(),
  primary key (board_id, user_id)
);

create table public.board_versions (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  state jsonb not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.board_activity (
  id bigint generated always as identity primary key,
  board_id uuid not null references public.boards(id) on delete cascade,
  actor_id uuid not null references auth.users(id),
  action text not null,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  card_id text,
  parent_id uuid references public.comments(id) on delete cascade,
  author_id uuid not null references auth.users(id),
  body text not null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.comment_mentions (
  comment_id uuid not null references public.comments(id) on delete cascade,
  mentioned_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, mentioned_user_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  board_id uuid references public.boards(id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index boards_workspace_id_idx on public.boards(workspace_id);
create index board_activity_board_created_idx on public.board_activity(board_id, created_at desc);
create index comments_board_created_idx on public.comments(board_id, created_at);
create index notifications_user_created_idx on public.notifications(user_id, created_at desc);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Security-definer helpers avoid recursive RLS evaluation when membership is
-- used to authorize access to workspaces and boards.
create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.workspace_members where workspace_id = target_workspace_id and user_id = auth.uid());
$$;

create or replace function public.is_board_member(target_board_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.board_members where board_id = target_board_id and user_id = auth.uid());
$$;

create or replace function public.is_board_editor(target_board_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.board_members where board_id = target_board_id and user_id = auth.uid() and role = 'editor');
$$;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.boards enable row level security;
alter table public.board_members enable row level security;
alter table public.board_versions enable row level security;
alter table public.board_activity enable row level security;
alter table public.comments enable row level security;
alter table public.comment_mentions enable row level security;
alter table public.notifications enable row level security;

create policy "Users can read profiles" on public.profiles for select to authenticated using (true);
create policy "Users can update their profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "Members can read workspaces" on public.workspaces for select to authenticated using (public.is_workspace_member(id));
create policy "Members can read workspace membership" on public.workspace_members for select to authenticated using (user_id = auth.uid() or public.is_workspace_member(workspace_id));
create policy "Members can read boards" on public.boards for select to authenticated using (public.is_workspace_member(workspace_id) or public.is_board_member(id));
create policy "Editors can update boards" on public.boards for update to authenticated using (public.is_board_editor(id)) with check (public.is_board_editor(id));
create policy "Board members can read board members" on public.board_members for select to authenticated using (user_id = auth.uid() or public.is_board_member(board_id));
create policy "Board members can read versions" on public.board_versions for select to authenticated using (public.is_board_member(board_id));
create policy "Board members can read activity" on public.board_activity for select to authenticated using (public.is_board_member(board_id));
create policy "Board members can read comments" on public.comments for select to authenticated using (public.is_board_member(board_id));
create policy "Members can manage their comments" on public.comments for all to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "Users can read their notifications" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "Users can update their notifications" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
