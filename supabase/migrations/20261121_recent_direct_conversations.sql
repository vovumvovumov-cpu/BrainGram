-- Return the signed-in user's recent one-to-one conversations with safe public peer details.
-- The function only exposes conversations in which auth.uid() is a participant.

create or replace function public.list_direct_conversations()
returns table (
  conversation_id uuid,
  peer_id uuid,
  username text,
  display_name text,
  avatar_url text,
  last_message text,
  last_message_at timestamptz,
  last_sender_id uuid
)
language sql
stable
security definer
set search_path = ''
as $function$
  select
    c.id as conversation_id,
    p.id as peer_id,
    coalesce(p.username, 'user') as username,
    coalesce(nullif(p.display_name, ''), p.username, 'Пользователь') as display_name,
    p.avatar_url,
    coalesce(m.body, '') as last_message,
    m.created_at as last_message_at,
    m.sender_id as last_sender_id
  from public.direct_conversations c
  join public.profiles p
    on p.id = case when c.user_a = auth.uid() then c.user_b else c.user_a end
  left join lateral (
    select dm.body, dm.created_at, dm.sender_id
    from public.direct_messages dm
    where dm.conversation_id = c.id
    order by dm.created_at desc
    limit 1
  ) m on true
  where auth.uid() is not null
    and auth.uid() in (c.user_a, c.user_b)
  order by coalesce(m.created_at, c.created_at) desc;
$function$;

revoke all on function public.list_direct_conversations() from public, anon;
grant execute on function public.list_direct_conversations() to authenticated;
