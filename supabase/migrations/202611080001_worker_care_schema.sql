-- WorkerCare Supabase schema. Apply with Supabase CLI or SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'WorkerCare user',
  role text not null default 'worker' check (role in ('supervisor','family','worker','safety_officer','admin')),
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  created_at timestamptz not null default now()
);
create table if not exists public.workers (
  id uuid primary key default gen_random_uuid(),
  worker_code text not null unique,
  auth_user_id uuid unique references public.profiles(id) on delete set null,
  full_name text not null,
  worker_type text not null default 'other' check (worker_type in ('construction','street_vendor','other')),
  site_id uuid references public.sites(id) on delete set null,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.worker_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  worker_id uuid not null references public.workers(id) on delete cascade,
  relationship text not null check (relationship in ('supervisor','family','safety_officer')),
  created_at timestamptz not null default now(),
  unique (user_id, worker_id, relationship)
);
create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  device_code text not null unique,
  worker_id uuid not null references public.workers(id) on delete cascade,
  label text,
  is_enabled boolean not null default true,
  battery_percent smallint check (battery_percent between 0 and 100),
  last_seen_at timestamptz,
  created_at timestamptz not null default now()
);

-- Secrets are isolated from client-readable tables and schemas.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table if not exists private.device_credentials (
  device_id uuid primary key references public.devices(id) on delete cascade,
  token_sha256 text not null,
  created_at timestamptz not null default now(),
  rotated_at timestamptz
);
revoke all on private.device_credentials from public, anon, authenticated;

create table if not exists public.sensor_readings (
  id bigint generated always as identity primary key,
  device_id uuid not null references public.devices(id) on delete cascade,
  worker_id uuid not null references public.workers(id) on delete cascade,
  ambient_temp_c numeric(5,2),
  relative_humidity numeric(5,2),
  battery_percent smallint check (battery_percent between 0 and 100),
  accel_x numeric(8,3),
  accel_y numeric(8,3),
  accel_z numeric(8,3),
  recorded_at timestamptz not null default now(),
  check (ambient_temp_c is null or ambient_temp_c between -20 and 85),
  check (relative_humidity is null or relative_humidity between 0 and 100)
);
create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.workers(id) on delete cascade,
  device_id uuid references public.devices(id) on delete set null,
  alert_type text not null check (alert_type in ('sos','fall','heat','humidity','device_offline','low_battery','system')),
  severity text not null default 'warning' check (severity in ('info','warning','high','critical')),
  title text not null,
  message text,
  details jsonb not null default '{}'::jsonb,
  status text not null default 'open' check (status in ('open','acknowledged','resolved')),
  acknowledged_by uuid references public.profiles(id) on delete set null,
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists public.worker_history (
  id bigint generated always as identity primary key,
  worker_id uuid not null references public.workers(id) on delete cascade,
  event_type text not null,
  description text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_assignments_user on public.worker_assignments(user_id);
create index if not exists idx_assignments_worker on public.worker_assignments(worker_id);
create index if not exists idx_readings_worker_time on public.sensor_readings(worker_id, recorded_at desc);
create index if not exists idx_readings_device_time on public.sensor_readings(device_id, recorded_at desc);
create index if not exists idx_alerts_worker_time on public.alerts(worker_id, created_at desc);
create index if not exists idx_alerts_open on public.alerts(status, created_at desc);
create index if not exists idx_history_worker_time on public.worker_history(worker_id, created_at desc);

-- Every new auth user starts with the least-privileged worker role.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, role)
  values (new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name',''), split_part(coalesce(new.email,'WorkerCare user'),'@',1)),
    'worker')
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.can_access_worker(target_worker_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.workers w where w.id = target_worker_id and w.auth_user_id = auth.uid())
  or exists (select 1 from public.worker_assignments a where a.worker_id = target_worker_id and a.user_id = auth.uid());
$$;
create or replace function public.has_staff_role()
returns boolean language sql stable security definer set search_path = public as $
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('supervisor','safety_officer','admin'));
$;
revoke all on function public.can_access_worker(uuid) from public, anon;
revoke all on function public.has_staff_role() from public, anon;
grant execute on function public.can_access_worker(uuid) to authenticated;
grant execute on function public.has_staff_role() to authenticated;

-- This RPC is callable only by service_role, never by a browser or device directly.
create or replace function public.verify_device_token(p_device_code text, p_token_sha256 text)
returns table(device_id uuid, worker_id uuid)
language sql security definer set search_path = public, private as $$
  select d.id, d.worker_id from public.devices d
  join private.device_credentials c on c.device_id = d.id
  where d.device_code = p_device_code and d.is_enabled = true and c.token_sha256 = p_token_sha256
  limit 1;
$$;
revoke all on function public.verify_device_token(text,text) from public, anon, authenticated;
grant execute on function public.verify_device_token(text,text) to service_role;

alter table public.profiles enable row level security;
alter table public.sites enable row level security;
alter table public.workers enable row level security;
alter table public.worker_assignments enable row level security;
alter table public.devices enable row level security;
alter table public.sensor_readings enable row level security;
alter table public.alerts enable row level security;
alter table public.worker_history enable row level security;

drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self on public.profiles for select to authenticated using (id = auth.uid());
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists sites_select_assigned on public.sites;
create policy sites_select_assigned on public.sites for select to authenticated using (
  exists (select 1 from public.workers w where w.site_id = sites.id and public.can_access_worker(w.id))
);
drop policy if exists workers_select_assigned on public.workers;
create policy workers_select_assigned on public.workers for select to authenticated using (public.can_access_worker(id));
drop policy if exists assignments_select_self on public.worker_assignments;
create policy assignments_select_self on public.worker_assignments for select to authenticated using (user_id = auth.uid());
drop policy if exists devices_select_assigned on public.devices;
create policy devices_select_assigned on public.devices for select to authenticated using (public.can_access_worker(worker_id));
drop policy if exists readings_select_assigned on public.sensor_readings;
create policy readings_select_assigned on public.sensor_readings for select to authenticated using (public.can_access_worker(worker_id));
drop policy if exists alerts_select_assigned on public.alerts;
create policy alerts_select_assigned on public.alerts for select to authenticated using (public.can_access_worker(worker_id));
drop policy if exists alerts_acknowledge_staff on public.alerts;
create policy alerts_acknowledge_staff on public.alerts for update to authenticated
using (public.has_staff_role() and public.can_access_worker(worker_id))
with check (public.has_staff_role() and public.can_access_worker(worker_id) and acknowledged_by = auth.uid());
drop policy if exists history_select_assigned on public.worker_history;
create policy history_select_assigned on public.worker_history for select to authenticated using (public.can_access_worker(worker_id));

grant select on public.profiles, public.sites, public.workers, public.worker_assignments,
  public.devices, public.sensor_readings, public.alerts, public.worker_history to authenticated;
revoke update on public.profiles from anon, authenticated;
grant update (display_name, phone, updated_at) on public.profiles to authenticated;
grant update (status, acknowledged_by, acknowledged_at, resolved_at) on public.alerts to authenticated;

-- Enable realtime for the live dashboard if the standard publication is present.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='sensor_readings') then
      alter publication supabase_realtime add table public.sensor_readings;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='alerts') then
      alter publication supabase_realtime add table public.alerts;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='devices') then
      alter publication supabase_realtime add table public.devices;
    end if;
  end if;
end $$;
