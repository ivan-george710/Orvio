begin;
-- Preserve the existing policy API, with privileged role lookup outside public.
create function private.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=(select auth.uid()) and role='admin');
$$;
revoke all on function private.is_admin() from public, anon, authenticated;
grant execute on function private.is_admin() to authenticated;
create or replace function public.is_admin() returns boolean language sql stable security invoker set search_path='' as $$ select private.is_admin(); $$;
revoke all on function public.is_admin() from public, anon, authenticated;
grant execute on function public.is_admin() to authenticated;
notify pgrst,'reload schema';
commit;
