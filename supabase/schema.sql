-- BrainGram account profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  about text not null default '',
  status text not null default 'В сети',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
drop policy if exists "Users can read their own profile" on public.profiles;
drop policy if exists "Users can create their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

create policy "Users can read their own profile" on public.profiles
  for select to authenticated using (auth.uid() = id);
create policy "Users can create their own profile" on public.profiles
  for insert to authenticated with check (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Usernames are unique regardless of letter case.
create unique index if not exists profiles_username_lower_unique
  on public.profiles (lower(username))
  where username is not null;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  new_username text;
begin
  new_username := lower(new.raw_user_meta_data ->> 'username');
  if new_username is null or new_username !~ '^[a-z0-9_]{3,20}$' then
    raise exception 'A valid unique username is required';
  end if;

  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    new_username,
    coalesce(new.raw_user_meta_data ->> 'display_name', new_username)
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();
