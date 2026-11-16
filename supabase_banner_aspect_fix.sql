-- Minimal migration for the banner aspect ratio RPCs.
-- Run the complete file in Supabase SQL Editor.

insert into public.site_settings (key, value_text)
values ('homepage_banner_aspect', '16:9')
on conflict (key) do nothing;

create or replace function public.get_homepage_banner_aspect()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select value_text from public.site_settings where key = 'homepage_banner_aspect'),
    '16:9'
  );
$$;

create or replace function public.admin_set_homepage_banner_aspect(p_aspect text)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Nur Admins duerfen das Bannerformat aendern.';
  end if;

  if p_aspect is null
     or (p_aspect not in ('9:16', '16:9')
         and p_aspect !~ '^custom:[1-9][0-9]{0,3}:[1-9][0-9]{0,3}$') then
    raise exception 'Ungueltiges Bannerformat.';
  end if;

  insert into public.site_settings (key, value_text, updated_at, updated_by)
  values ('homepage_banner_aspect', p_aspect, now(), auth.uid())
  on conflict (key) do update
    set value_text = excluded.value_text,
        updated_at = now(),
        updated_by = auth.uid();

  return p_aspect;
end;
$$;

grant execute on function public.get_homepage_banner_aspect() to anon, authenticated;
grant execute on function public.admin_set_homepage_banner_aspect(text) to authenticated;

notify pgrst, 'reload schema';
