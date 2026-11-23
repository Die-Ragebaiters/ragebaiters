-- Activate the already uploaded custom banner, without calling any RPC function.
-- Run in the Supabase SQL Editor (PostgreSQL).
insert into public.site_settings (key, value_text, updated_at, updated_by)
select 'homepage_banner_variant', 'custom', now(), null
where exists (
  select 1
  from public.site_settings as saved_banner
  where saved_banner.key = 'homepage_banner_custom_path'
    and nullif(trim(saved_banner.value_text), '') is not null
)
on conflict (key) do update
  set value_text = excluded.value_text,
      updated_at = now(),
      updated_by = null
returning key, value_text;
