-- Replace the retired static sponsor preset with the team banner.
update public.site_settings
set value_text = 'team',
    updated_at = now(),
    updated_by = null
where key = 'homepage_banner_variant'
  and value_text = 'sponsor';
