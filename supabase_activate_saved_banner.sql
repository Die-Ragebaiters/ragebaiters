-- Activate the already uploaded custom banner, without calling any RPC function.
-- Run in the Supabase SQL Editor (PostgreSQL).
update public.site_settings as active_setting
set value_text = 'custom',
    updated_at = now(),
    updated_by = null
where active_setting.key = 'homepage_banner_variant'
  and exists (
    select 1
    from public.site_settings as saved_banner
    where saved_banner.key = 'homepage_banner_custom_path'
      and nullif(trim(saved_banner.value_text), '') is not null
  )
returning active_setting.key, active_setting.value_text;
