-- 灵作 Supabase 初始 schema
-- 在 Supabase SQL Editor 中执行一次。

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text not null unique check (handle ~ '^[a-z0-9_]{3,20}$'),
  name text not null check (char_length(name) between 2 and 40),
  bio text not null default '',
  location text not null default '',
  links text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.works (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('game', 'drama', 'novel', 'tutorial')),
  slug text not null unique,
  title text not null,
  summary text not null default '',
  cover_url text,
  tags text[] not null default '{}',
  tools text[] not null default '{}',
  models text[] not null default '{}',
  license text not null default '允许二创（需署名）',
  ai_disclosure text not null default '含 AI 生成内容',
  meta jsonb not null default '{}'::jsonb,
  content jsonb not null default '{}'::jsonb,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references public.works(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 500),
  spoiler boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  work_id uuid not null references public.works(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, work_id)
);

create table if not exists public.saves (
  user_id uuid not null references public.profiles(id) on delete cascade,
  work_id uuid not null references public.works(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, work_id)
);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('讨论', '求助', '交作业', '创作日志')),
  title text not null,
  body text not null,
  tags text[] not null default '{}',
  related_work_id uuid references public.works(id) on delete set null,
  topic text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null default '',
  href text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists works_author_idx on public.works(author_id, created_at desc);
create index if not exists works_published_idx on public.works(published, created_at desc);
create index if not exists comments_work_idx on public.comments(work_id, created_at desc);
create index if not exists posts_created_idx on public.posts(created_at desc);
create index if not exists notifications_user_idx on public.notifications(user_id, read, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists works_updated_at on public.works;
create trigger works_updated_at before update on public.works
for each row execute function public.set_updated_at();

drop trigger if exists comments_updated_at on public.comments;
create trigger comments_updated_at before update on public.comments
for each row execute function public.set_updated_at();

drop trigger if exists posts_updated_at on public.posts;
create trigger posts_updated_at before update on public.posts
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  desired_handle text;
  desired_name text;
begin
  desired_handle := lower(coalesce(new.raw_user_meta_data->>'handle', 'u_' || substr(new.id::text, 1, 8)));
  desired_name := coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), '新用户');
  insert into public.profiles (id, handle, name)
  values (new.id, desired_handle, desired_name)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.works enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;
alter table public.saves enable row level security;
alter table public.follows enable row level security;
alter table public.posts enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "profiles readable" on public.profiles;
create policy "profiles readable" on public.profiles for select using (true);
drop policy if exists "profiles own update" on public.profiles;
create policy "profiles own update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "works public read" on public.works;
create policy "works public read" on public.works for select using (published or auth.uid() = author_id);
drop policy if exists "works own insert" on public.works;
create policy "works own insert" on public.works for insert with check (auth.uid() = author_id);
drop policy if exists "works own update" on public.works;
create policy "works own update" on public.works for update using (auth.uid() = author_id) with check (auth.uid() = author_id);
drop policy if exists "works own delete" on public.works;
create policy "works own delete" on public.works for delete using (auth.uid() = author_id);

drop policy if exists "comments public read" on public.comments;
create policy "comments public read" on public.comments for select using (true);
drop policy if exists "comments own insert" on public.comments;
create policy "comments own insert" on public.comments for insert with check (auth.uid() = author_id);
drop policy if exists "comments own update" on public.comments;
create policy "comments own update" on public.comments for update using (auth.uid() = author_id) with check (auth.uid() = author_id);
drop policy if exists "comments own delete" on public.comments;
create policy "comments own delete" on public.comments for delete using (auth.uid() = author_id);

drop policy if exists "likes public read" on public.likes;
create policy "likes public read" on public.likes for select using (true);
drop policy if exists "likes own write" on public.likes;
create policy "likes own write" on public.likes for insert with check (auth.uid() = user_id);
drop policy if exists "likes own delete" on public.likes;
create policy "likes own delete" on public.likes for delete using (auth.uid() = user_id);

drop policy if exists "saves own read" on public.saves;
create policy "saves own read" on public.saves for select using (auth.uid() = user_id);
drop policy if exists "saves own write" on public.saves;
create policy "saves own write" on public.saves for insert with check (auth.uid() = user_id);
drop policy if exists "saves own delete" on public.saves;
create policy "saves own delete" on public.saves for delete using (auth.uid() = user_id);

drop policy if exists "follows public read" on public.follows;
create policy "follows public read" on public.follows for select using (true);
drop policy if exists "follows own write" on public.follows;
create policy "follows own write" on public.follows for insert with check (auth.uid() = follower_id);
drop policy if exists "follows own delete" on public.follows;
create policy "follows own delete" on public.follows for delete using (auth.uid() = follower_id);

drop policy if exists "posts public read" on public.posts;
create policy "posts public read" on public.posts for select using (true);
drop policy if exists "posts own write" on public.posts;
create policy "posts own write" on public.posts for insert with check (auth.uid() = author_id);
drop policy if exists "posts own update" on public.posts;
create policy "posts own update" on public.posts for update using (auth.uid() = author_id) with check (auth.uid() = author_id);
drop policy if exists "posts own delete" on public.posts;
create policy "posts own delete" on public.posts for delete using (auth.uid() = author_id);

drop policy if exists "notifications own read" on public.notifications;
create policy "notifications own read" on public.notifications for select using (auth.uid() = user_id);
drop policy if exists "notifications own update" on public.notifications;
create policy "notifications own update" on public.notifications for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "media public read" on storage.objects;
create policy "media public read" on storage.objects for select using (bucket_id = 'media');
drop policy if exists "media own upload" on storage.objects;
create policy "media own upload" on storage.objects for insert to authenticated
with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "media own update" on storage.objects;
create policy "media own update" on storage.objects for update to authenticated
using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "media own delete" on storage.objects;
create policy "media own delete" on storage.objects for delete to authenticated
using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
