-- Adds the remaining event metadata without changing account roles or existing
-- registration policies. Run against the Supabase project used by Orvio.
begin;

do $$
begin
  if to_regclass('public.events') is null
     or not exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'events'
         and column_name = 'created_by'
     )
     or not exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'profiles'
         and column_name = 'full_name'
     ) then
    raise exception 'This database does not match the Orvio schema. No changes applied.';
  end if;
end;
$$;

alter table public.events
  add column if not exists category text not null default 'other';

alter table public.events
  add column if not exists banner_url text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.events'::regclass
      and conname = 'events_category_allowed'
  ) then
    alter table public.events
      add constraint events_category_allowed
      check (category in (
        'technology', 'workshop', 'cultural', 'sports', 'community', 'other'
      ));
  end if;
end;
$$;

create index if not exists events_approved_category_schedule_idx
  on public.events (category, event_datetime, id)
  where status = 'approved';

-- Public access is limited to the purpose-built event image bucket. Uploaded
-- banners are intended to be visible on publicly discoverable event pages.
-- An existing private bucket is never silently changed to public.
insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
) values (
  'event-banners', 'event-banners', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

do $$
begin
  if exists (
    select 1 from storage.buckets
    where id = 'event-banners'
      and (
        public is not true
        or file_size_limit is distinct from 5242880
        or allowed_mime_types is distinct from
          array['image/jpeg', 'image/png', 'image/webp']::text[]
      )
  ) then
    raise exception 'Existing event-banners configuration differs. Review it before applying this migration.';
  end if;
end;
$$;

-- Listing and all writes are scoped to a verified account's own folder.
-- No service-role credential is needed in the browser.
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'storage'
      and tablename = 'objects' and policyname = 'event_banners_insert_own'
  ) then
    create policy event_banners_insert_own on storage.objects
      for insert to authenticated
      with check (
        bucket_id = 'event-banners'
        and (storage.foldername(name))[1] = (select auth.uid())::text
      );
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'storage'
      and tablename = 'objects' and policyname = 'event_banners_select_own'
  ) then
    create policy event_banners_select_own on storage.objects
      for select to authenticated
      using (
        bucket_id = 'event-banners'
        and (storage.foldername(name))[1] = (select auth.uid())::text
      );
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'storage'
      and tablename = 'objects' and policyname = 'event_banners_update_own'
  ) then
    create policy event_banners_update_own on storage.objects
      for update to authenticated
      using (
        bucket_id = 'event-banners'
        and (storage.foldername(name))[1] = (select auth.uid())::text
      )
      with check (
        bucket_id = 'event-banners'
        and (storage.foldername(name))[1] = (select auth.uid())::text
      );
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'storage'
      and tablename = 'objects' and policyname = 'event_banners_delete_own'
  ) then
    create policy event_banners_delete_own on storage.objects
      for delete to authenticated
      using (
        bucket_id = 'event-banners'
        and (storage.foldername(name))[1] = (select auth.uid())::text
      );
  end if;
end;
$$;

notify pgrst, 'reload schema';
commit;
