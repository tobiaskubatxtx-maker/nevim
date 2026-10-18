-- JK Liberec. Run once as a migration in a Supabase project.
create extension if not exists btree_gist with schema extensions;
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check (length(trim(display_name)) between 1 and 120),
 role text not null default 'member' check (role in ('member','admin')),
 active boolean not null default true
);
create table public.areas (
 id text primary key,
 name text not null,
 active boolean not null default true
);
insert into public.areas(id,name) values ('hala','Krytá hala'),('kolbiste','Venkovní kolbiště'),('trava','Travnatá plocha');
create table public.reservations (
 id uuid primary key default gen_random_uuid(),
 area_id text not null references public.areas(id),
 user_id uuid not null references public.profiles(id),
 starts_at timestamptz not null,
 ends_at timestamptz not null,
 note text not null default '' check (length(note)<=1000),
 kind text not null default 'booking' check (kind in ('booking','closure')),
 created_at timestamptz not null default now(),
 check (ends_at>starts_at),
 check ((starts_at at time zone 'Europe/Prague')::date = (ends_at at time zone 'Europe/Prague')::date),
 check ((starts_at at time zone 'Europe/Prague')::time >= time '06:00'),
 check ((ends_at at time zone 'Europe/Prague')::time <= time '21:00'),
 -- Half-open ranges allow an adjacent booking; overlapping rows cannot commit,
 -- including concurrent inserts/updates and administrator maintenance closures.
 constraint no_area_overlap exclude using gist
 (area_id with =, tstzrange(starts_at,ends_at,'[)') with &&)
);
create index reservations_user_start on public.reservations(user_id,starts_at);
create table public.operating_rules (
 id integer primary key,
 title text not null,
 content text not null,
 is_draft boolean not null default true
);
insert into public.operating_rules values
 (1,'Pravidla rezervací','NÁVRH: Rezervujte si celou plochu před začátkem tréninku.',true),
 (2,'Bezpečnost při jízdě','NÁVRH: Používejte ochrannou přilbu a respektujte ostatní jezdce.',true),
 (3,'Povinnosti jezdců','NÁVRH: Po tréninku ukliďte použité pomůcky.',true),
 (4,'Používání jízdárenských ploch','NÁVRH: Respektujte uzavření ploch a pokyny správce.',true),
 (5,'Rušení rezervací','NÁVRH: Nepotřebný termín uvolněte co nejdříve.',true);

create function public.is_active_member() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=auth.uid() and active);
$$;
create function public.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=auth.uid() and active and role='admin');
$$;
revoke all on function public.is_active_member() from public,anon;
revoke all on function public.is_admin() from public,anon;
grant execute on function public.is_active_member(),public.is_admin() to authenticated;

-- Signup metadata can supply a name, never a role. Invite-only signups should
-- be configured in Auth; the first administrator is provisioned by SQL below.
create function public.create_member_profile() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(id,display_name) values(new.id,left(coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'),''),'Člen klubu'),120));
 return new;
end; $$;
revoke all on function public.create_member_profile() from public,anon,authenticated;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.create_member_profile();

create function public.guard_reservation() returns trigger language plpgsql security definer set search_path='' as $$
declare area_open boolean; member_active boolean;
begin
 -- Serializes reservation writes with changes to area availability.
 select active into area_open from public.areas where id=new.area_id for share;
 if area_open is distinct from true then raise exception using errcode='P0001',message='Plocha je dočasně uzavřená.'; end if;
 select active into member_active from public.profiles where id=new.user_id for share;
 if member_active is distinct from true then raise exception using errcode='P0001',message='Uživatel není aktivní.'; end if;
 if new.starts_at < now() then raise exception using errcode='P0001',message='Nelze vytvořit nebo změnit rezervaci v minulosti.'; end if;
 return new;
end; $$;
revoke all on function public.guard_reservation() from public,anon,authenticated;
create trigger validate_reservation before insert or update on public.reservations for each row execute function public.guard_reservation();

alter table public.profiles enable row level security;
alter table public.areas enable row level security;
alter table public.reservations enable row level security;
alter table public.operating_rules enable row level security;
revoke all on public.profiles,public.areas,public.reservations,public.operating_rules from anon,authenticated;
grant select on public.profiles,public.areas,public.reservations,public.operating_rules to authenticated;
grant update on public.profiles,public.areas,public.operating_rules to authenticated;
grant insert,update,delete on public.reservations to authenticated;
create policy profiles_read on public.profiles for select to authenticated using (id=auth.uid() or public.is_active_member());
create policy profiles_admin on public.profiles for update to authenticated using(public.is_admin()) with check(public.is_admin());
create policy areas_read on public.areas for select to authenticated using(public.is_active_member());
create policy areas_admin on public.areas for update to authenticated using(public.is_admin()) with check(public.is_admin());
create policy reservations_read on public.reservations for select to authenticated using(public.is_active_member());
create policy reservations_insert on public.reservations for insert to authenticated with check
 (public.is_active_member() and ((user_id=auth.uid() and kind='booking') or public.is_admin()));
create policy reservations_update on public.reservations for update to authenticated using
 (public.is_active_member() and ((user_id=auth.uid() and kind='booking') or public.is_admin())) with check
 (public.is_active_member() and ((user_id=auth.uid() and kind='booking') or public.is_admin()));
create policy reservations_delete on public.reservations for delete to authenticated using
 (public.is_active_member() and ((user_id=auth.uid() and kind='booking') or public.is_admin()));
create policy rules_read on public.operating_rules for select to authenticated using(public.is_active_member());
create policy rules_admin on public.operating_rules for update to authenticated using(public.is_admin()) with check(public.is_admin());
-- Bootstrap the first admin as project owner AFTER inviting the account:
-- update public.profiles set role='admin' where id='<verified Auth user UUID>';
