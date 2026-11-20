-- Secure username discovery for starting new direct conversations.
-- Apply after supabase/schema.sql and 20261118_profile_avatars.sql.

create or replace function public.search_profiles(
  search_query text,
  result_limit integer default 20
)
returns table (
  id uuid,
  username text,
  display_name text,
  avatar_url text
)
language sql
stable
security definer
set search_path = ''
as $function$
  with params as (
    select regexp_replace(
      lower(trim(coalesce(search_query, ''))),
      '[^a-z0-9_]',
      '',
      'g'
    ) as term
  )
  select
    p.id,
    p.username,
    coalesce(nullif(p.display_name, ''), p.username) as display_name,
    p.avatar_url
  from public.profiles as p
  cross join params as q
  where auth.uid() is not null
    and char_length(q.term) between 3 and 20
    and p.id <> auth.uid()
    and left(lower(p.username), char_length(q.term)) = q.term
  order by
    (lower(p.username) = q.term) desc,
    lower(p.username) asc
  limit least(greatest(coalesce(result_limit, 20), 1), 20);
$function$;

-- The function exposes only fields needed to identify another account.
-- Direct table access remains protected by the profiles RLS policies.
revoke all on function public.search_profiles(text, integer)
  from public, anon, authenticated;
grant execute on function public.search_profiles(text, integer)
  to authenticated;

comment on function public.search_profiles(text, integer) is
  'Returns up to 20 public identity fields for username-prefix search by authenticated users.';
