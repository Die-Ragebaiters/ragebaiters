-- Ragebaiters Storage Owner Setup
-- Nur mit Owner-/supabase_storage_admin-Rechten ausfuehren.
-- Diese Datei konfiguriert den Storage-Bucket und die Policies auf storage.objects.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'photos',
  'photos',
  false,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists photos_read_signed on storage.objects;
create policy photos_read_signed
on storage.objects
for select
to authenticated
using (
  bucket_id = 'photos'
  and exists (
    select 1
    from public.photos p
    where p.storage_path = storage.objects.name
      and (
        p.user_id = auth.uid()
        or p.visibility = 'public'
        or (p.visibility = 'nathan_only' and public.can_view_nathan_posts())
      )
  )
);

drop policy if exists photos_upload_own on storage.objects;
create policy photos_upload_own
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'photos'
  and exists (
    select 1
    from public.photos p
    where p.storage_path = storage.objects.name
      and p.user_id = auth.uid()
  )
);

drop policy if exists photos_delete_own_or_admin on storage.objects;
create policy photos_delete_own_or_admin
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'photos'
  and exists (
    select 1
    from public.photos p
    where p.storage_path = storage.objects.name
      and (p.user_id = auth.uid() or public.is_admin())
  )
);
