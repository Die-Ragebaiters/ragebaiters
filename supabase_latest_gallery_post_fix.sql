-- Always return the newest visible gallery post on the homepage.
create or replace function public.get_latest_gallery_photo(p_include_internal boolean default false)
returns table (
  id bigint,
  storage_path text,
  title text,
  caption text,
  author text,
  uploaded_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.id,
    p.storage_path,
    p.title,
    p.caption,
    coalesce(pr.username, 'anonym') as author,
    p.uploaded_at
  from public.photos p
  left join public.profiles pr on pr.id = p.user_id
  where p.visibility = 'public'
     or (
       p.visibility = 'troll_internal'
       and p_include_internal
       and public.current_user_role() in ('observer', 'admin')
     )
  order by p.uploaded_at desc nulls last, p.id desc
  limit 1;
$$;

grant execute on function public.get_latest_gallery_photo(boolean) to anon, authenticated;
notify pgrst, 'reload schema';
