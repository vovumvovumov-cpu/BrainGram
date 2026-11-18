-- Persist profile avatars in Supabase Storage.
-- Run this once in the Supabase SQL Editor after applying supabase/schema.sql.

alter table public.profiles
  add column if not exists avatar_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "BrainGram avatars are public" on storage.objects;
create policy "BrainGram avatars are public"
  on storage.objects for select
  to public
  using (bucket_id = 'avatars');

drop policy if exists "Users upload their own BrainGram avatar" on storage.objects;
create policy "Users upload their own BrainGram avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users update their own BrainGram avatar" on storage.objects;
create policy "Users update their own BrainGram avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users delete their own BrainGram avatar" on storage.objects;
create policy "Users delete their own BrainGram avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
