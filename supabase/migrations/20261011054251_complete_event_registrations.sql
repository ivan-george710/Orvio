-- Extends the existing table without replacing registrations or their IDs.
begin;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;
alter table public.registrations add column status text not null default 'registered';
alter table public.registrations add column cancelled_at timestamptz;
update public.registrations set registered_at = now() where registered_at is null;
alter table public.registrations alter column registered_at set not null;
alter table public.registrations add constraint registrations_status_check check (status in ('registered','cancelled'));
alter table public.registrations add constraint registrations_cancellation_check check ((status='registered' and cancelled_at is null) or (status='cancelled' and cancelled_at is not null));
alter table public.registrations drop constraint if exists registrations_event_id_user_id_key;
alter table public.registrations drop constraint if exists registrations_event_user_unique;
create unique index registrations_one_active on public.registrations(event_id,user_id) where status='registered';
create index registrations_user_history on public.registrations(user_id,registered_at desc);
create index registrations_event_history on public.registrations(event_id,registered_at desc);
create index if not exists events_created_by_idx on public.events(created_by);

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=(select auth.uid()) and role='admin');
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(id,full_name,role) values(new.id,new.raw_user_meta_data->>'full_name','participant');
 return new;
end; $$;
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- Keep admin role management, but forbid participants from changing their own role.
create function private.guard_profile() returns trigger language plpgsql set search_path='' as $$
begin
 if current_user in ('anon','authenticated') then
  if TG_OP='UPDATE' and new.id is distinct from old.id then raise exception 'PROFILE_ID_IMMUTABLE'; end if;
  if not public.is_admin() then
   if (TG_OP='INSERT' and new.role is distinct from 'participant') or
      (TG_OP='UPDATE' and new.role is distinct from old.role) then raise exception 'ROLE_CHANGE_FORBIDDEN'; end if;
  end if;
 end if;
 return new;
end; $$;
revoke all on function private.guard_profile() from public, anon, authenticated;
create trigger protect_profile_role before insert or update on public.profiles for each row execute function private.guard_profile();
revoke truncate, trigger, references, delete on public.profiles from anon, authenticated;
revoke insert, update on public.profiles from anon;
revoke truncate, trigger, references on public.events from anon, authenticated;
revoke insert, update, delete on public.events from anon;
drop policy "Users can create events" on public.events;
create policy "Users can create pending events" on public.events for insert to authenticated with check (created_by=(select auth.uid()) and status='pending');

create function private.can_manage_attendees(p_event_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and (exists(select 1 from public.events where id=p_event_id and created_by=auth.uid()) or exists(select 1 from public.profiles where id=auth.uid() and role='admin'));
$$;
create function private.has_registration(p_event_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.registrations where event_id=p_event_id and user_id=auth.uid());
$$;
revoke all on function private.can_manage_attendees(uuid), private.has_registration(uuid) from public;
grant execute on function private.can_manage_attendees(uuid), private.has_registration(uuid) to anon, authenticated;
create policy "Participants can view their registered events" on public.events for select to authenticated using (private.has_registration(id));
alter table public.registrations enable row level security;
drop policy "Users register" on public.registrations;
drop policy "Users view registrations" on public.registrations;
drop policy admin_delete_registrations on public.registrations;
create policy "Own registrations and authorized attendees" on public.registrations for select to authenticated using (user_id=(select auth.uid()) or private.can_manage_attendees(event_id));
revoke all on public.registrations from anon, authenticated;
grant select on public.registrations to authenticated;

create function private.register_for_event(p_event_id uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); v_event public.events%rowtype; v_id uuid;
begin
 if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
 select * into v_event from public.events where id=p_event_id for update;
 if not found then raise exception 'EVENT_NOT_FOUND'; end if;
 if v_event.status <> 'approved' then raise exception 'EVENT_NOT_APPROVED'; end if;
 if v_event.event_datetime is null or v_event.event_datetime <= clock_timestamp() then raise exception 'EVENT_STARTED'; end if;
 if exists(select 1 from public.registrations where event_id=p_event_id and user_id=v_user and status='registered') then raise exception 'ALREADY_REGISTERED'; end if;
 if v_event.max_participants is null or v_event.max_participants <= (select count(*) from public.registrations where event_id=p_event_id and status='registered') then raise exception 'EVENT_FULL'; end if;
 insert into public.registrations(event_id,user_id,status) values(p_event_id,v_user,'registered') returning id into v_id;
 return v_id;
end; $$;
create function private.cancel_registration(p_event_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); v_start timestamptz;
begin
 if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
 select event_datetime into v_start from public.events where id=p_event_id for update;
 if not found then raise exception 'EVENT_NOT_FOUND'; end if;
 if v_start is null or v_start <= clock_timestamp() then raise exception 'EVENT_STARTED'; end if;
 update public.registrations set status='cancelled',cancelled_at=clock_timestamp() where event_id=p_event_id and user_id=v_user and status='registered';
 if not found then raise exception 'NO_ACTIVE_REGISTRATION'; end if;
end; $$;

-- Also serialize capacity reductions with registrations (UPDATE holds the event row lock).
create function private.guard_event_capacity() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.max_participants is distinct from old.max_participants and (new.max_participants is null or new.max_participants < (select count(*) from public.registrations where event_id=new.id and status='registered')) then raise exception 'CAPACITY_BELOW_REGISTRATIONS'; end if;
 return new;
end; $$;
revoke all on function private.guard_event_capacity() from public,anon,authenticated;
create trigger protect_event_capacity before update on public.events for each row execute function private.guard_event_capacity();

create function private.registration_summaries(p_event_ids uuid[]) returns table(event_id uuid,active_count bigint,remaining_spots bigint,is_registered boolean,can_manage boolean,organizer_name text) language sql stable security definer set search_path='' as $$
 select e.id, count(r.id), greatest(coalesce(e.max_participants,0)-count(r.id),0),
 coalesce(bool_or(r.user_id=auth.uid()),false), private.can_manage_attendees(e.id),coalesce(nullif(btrim(p.full_name),''),'Unknown Organizer')
 from public.events e left join public.registrations r on r.event_id=e.id and r.status='registered' left join public.profiles p on p.id=e.created_by
 where e.id=any(p_event_ids) and (e.status='approved' or private.can_manage_attendees(e.id) or private.has_registration(e.id))
 group by e.id,p.full_name;
$$;
create function private.get_my_registrations() returns table(id uuid,event_id uuid,status text,registered_at timestamptz,cancelled_at timestamptz,event jsonb) language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 return query select r.id,r.event_id,r.status,r.registered_at,r.cancelled_at,to_jsonb(e) from public.registrations r join public.events e on e.id=r.event_id where r.user_id=auth.uid() order by r.registered_at desc,r.id;
end; $$;
create function private.get_event_attendees(p_event_id uuid) returns table(id uuid,full_name text,registered_at timestamptz,status text,cancelled_at timestamptz) language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 if not private.can_manage_attendees(p_event_id) then raise exception 'ATTENDEES_FORBIDDEN'; end if;
 return query select r.id,coalesce(nullif(btrim(p.full_name),''),'Unknown Attendee'),r.registered_at,r.status,r.cancelled_at from public.registrations r left join public.profiles p on p.id=r.user_id where r.event_id=p_event_id order by r.registered_at desc,r.id;
end; $$;

-- Exposed functions are narrow invoker wrappers. Privileged code lives outside the API schema.
create function public.register_for_event(p_event_id uuid) returns uuid language sql security invoker set search_path='' as $$ select private.register_for_event(p_event_id); $$;
create function public.cancel_registration(p_event_id uuid) returns void language sql security invoker set search_path='' as $$ select private.cancel_registration(p_event_id); $$;
create function public.registration_summaries(p_event_ids uuid[]) returns table(event_id uuid,active_count bigint,remaining_spots bigint,is_registered boolean,can_manage boolean,organizer_name text) language sql stable security invoker set search_path='' as $$ select * from private.registration_summaries(p_event_ids); $$;
create function public.get_my_registrations() returns table(id uuid,event_id uuid,status text,registered_at timestamptz,cancelled_at timestamptz,event jsonb) language sql stable security invoker set search_path='' as $$ select * from private.get_my_registrations(); $$;
create function public.get_event_attendees(p_event_id uuid) returns table(id uuid,full_name text,registered_at timestamptz,status text,cancelled_at timestamptz) language sql stable security invoker set search_path='' as $$ select * from private.get_event_attendees(p_event_id); $$;
revoke all on function private.register_for_event(uuid),private.cancel_registration(uuid),private.registration_summaries(uuid[]),private.get_my_registrations(),private.get_event_attendees(uuid) from public,anon,authenticated;
revoke all on function public.register_for_event(uuid),public.cancel_registration(uuid),public.registration_summaries(uuid[]),public.get_my_registrations(),public.get_event_attendees(uuid) from public,anon,authenticated;
grant execute on function private.register_for_event(uuid),private.cancel_registration(uuid),private.get_my_registrations(),private.get_event_attendees(uuid), public.register_for_event(uuid),public.cancel_registration(uuid),public.get_my_registrations(),public.get_event_attendees(uuid) to authenticated;
grant execute on function private.registration_summaries(uuid[]),public.registration_summaries(uuid[]) to anon,authenticated;
notify pgrst,'reload schema';
commit;
