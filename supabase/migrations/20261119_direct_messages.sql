-- BrainGram direct-message storage.
-- Apply after supabase/schema.sql and the profile avatar migration.

create table if not exists public.direct_conversations (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references auth.users(id) on delete cascade,
  user_b uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint direct_conversations_distinct_users check (user_a < user_b),
  constraint direct_conversations_unique_pair unique (user_a, user_b)
);

create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null
    references public.direct_conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null
    check (char_length(btrim(body)) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index if not exists direct_messages_conversation_created_idx
  on public.direct_messages (conversation_id, created_at desc);

alter table public.direct_conversations enable row level security;
alter table public.direct_messages enable row level security;

drop policy if exists "Participants can read direct conversations"
  on public.direct_conversations;
create policy "Participants can read direct conversations"
  on public.direct_conversations
  for select to authenticated
  using (auth.uid() = user_a or auth.uid() = user_b);

drop policy if exists "Participants can read direct messages"
  on public.direct_messages;
create policy "Participants can read direct messages"
  on public.direct_messages
  for select to authenticated
  using (
    exists (
      select 1
      from public.direct_conversations c
      where c.id = conversation_id
        and auth.uid() in (c.user_a, c.user_b)
    )
  );

drop policy if exists "Participants can send direct messages"
  on public.direct_messages;
create policy "Participants can send direct messages"
  on public.direct_messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1
      from public.direct_conversations c
      where c.id = conversation_id
        and auth.uid() in (c.user_a, c.user_b)
    )
  );

revoke all on table public.direct_conversations from public, anon, authenticated;
revoke all on table public.direct_messages from public, anon, authenticated;
grant select on table public.direct_conversations to authenticated;
grant select, insert on table public.direct_messages to authenticated;

-- Create a single conversation for a pair, regardless of which participant starts it.
create or replace function public.get_or_create_direct_conversation(other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  current_user_id uuid := auth.uid();
  first_user_id uuid;
  second_user_id uuid;
  conversation_id uuid;
begin
  if current_user_id is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;

  if other_user_id is null or other_user_id = current_user_id then
    raise exception using errcode = '22023', message = 'Choose another user';
  end if;

  if not exists (
    select 1 from public.profiles p where p.id = other_user_id
  ) then
    raise exception using errcode = 'P0002', message = 'User not found';
  end if;

  if current_user_id < other_user_id then
    first_user_id := current_user_id;
    second_user_id := other_user_id;
  else
    first_user_id := other_user_id;
    second_user_id := current_user_id;
  end if;

  insert into public.direct_conversations (user_a, user_b)
  values (first_user_id, second_user_id)
  on conflict (user_a, user_b)
  do update set user_a = excluded.user_a
  returning id into conversation_id;

  return conversation_id;
end;
$function$;

revoke all on function public.get_or_create_direct_conversation(uuid) from public;
grant execute on function public.get_or_create_direct_conversation(uuid) to authenticated;

-- Enable Supabase Realtime for conversation lists and incoming messages when available.
do $block$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'direct_conversations'
    ) then
      execute 'alter publication supabase_realtime add table public.direct_conversations';
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'direct_messages'
    ) then
      execute 'alter publication supabase_realtime add table public.direct_messages';
    end if;
  end if;
end;
$block$;
