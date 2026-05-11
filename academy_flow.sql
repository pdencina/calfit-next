-- =========================================
-- CALFIT - Flujo SaaS: Academia + registro por código
-- Ejecutar en Supabase SQL Editor
-- =========================================

create extension if not exists "pgcrypto";

-- =========================================
-- ACADEMIAS
-- =========================================

create table if not exists public.academias (
  id uuid primary key default gen_random_uuid(),
  name text,
  nombre text,
  codigo text,
  color text default '#c8f542',
  plan text default 'founder',
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table public.academias add column if not exists name text;
alter table public.academias add column if not exists nombre text;
alter table public.academias add column if not exists codigo text;
alter table public.academias add column if not exists color text default '#c8f542';
alter table public.academias add column if not exists plan text default 'founder';
alter table public.academias add column if not exists is_active boolean default true;
alter table public.academias add column if not exists created_at timestamptz default now();

update public.academias
set
  name = coalesce(name, nombre, 'CALFIT Demo'),
  nombre = coalesce(nombre, name, 'CALFIT Demo'),
  codigo = upper(coalesce(codigo, 'ASD123')),
  color = coalesce(color, '#c8f542'),
  plan = coalesce(plan, 'founder'),
  is_active = coalesce(is_active, true);

create unique index if not exists academias_codigo_unique_idx
on public.academias (codigo)
where codigo is not null;

insert into public.academias (name, nombre, codigo, color, plan, is_active)
values ('CALFIT Demo', 'CALFIT Demo', 'ASD123', '#c8f542', 'founder', true)
on conflict do nothing;

-- =========================================
-- PROFILES
-- =========================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text default 'alumno',
  academia_id uuid,
  created_at timestamptz default now()
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists role text default 'alumno';
alter table public.profiles add column if not exists academia_id uuid;
alter table public.profiles add column if not exists created_at timestamptz default now();

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
check (role in ('super_admin', 'admin', 'profe', 'alumno'));

-- Foreign key segura si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_academia_id_fkey'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_academia_id_fkey
    FOREIGN KEY (academia_id)
    REFERENCES public.academias(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- =========================================
-- FUNCIÓN: crear perfil automático al registrarse
-- Lee metadata enviada desde el front:
-- full_name, role, academia_code
-- =========================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_full_name text;
  v_academia_code text;
  v_academia_id uuid;
begin
  v_role := coalesce(new.raw_user_meta_data->>'role', 'alumno');

  if v_role not in ('profe', 'alumno') then
    v_role := 'alumno';
  end if;

  v_full_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1)
  );

  v_academia_code := upper(trim(coalesce(new.raw_user_meta_data->>'academia_code', 'ASD123')));

  select id
  into v_academia_id
  from public.academias
  where upper(codigo) = v_academia_code
    and coalesce(is_active, true) = true
  limit 1;

  if v_academia_id is null then
    select id
    into v_academia_id
    from public.academias
    where codigo = 'ASD123'
    limit 1;
  end if;

  insert into public.profiles (
    id,
    email,
    full_name,
    role,
    academia_id
  ) values (
    new.id,
    new.email,
    v_full_name,
    v_role,
    v_academia_id
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    role = excluded.role,
    academia_id = excluded.academia_id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- =========================================
-- TU USUARIO SUPER ADMIN
-- =========================================

update public.profiles
set role = 'super_admin',
    full_name = coalesce(full_name, 'Pablo Encina'),
    email = coalesce(email, 'encinaacevedo.pablo@gmail.com')
where email in ('encinaacevedo.pablo@gmail.com', 'encinaaceevdo.pablo@gmail.com');

-- Si el perfil no existe pero sí existe en auth.users
insert into public.profiles (id, email, full_name, role, academia_id)
select
  u.id,
  u.email,
  'Pablo Encina',
  'super_admin',
  a.id
from auth.users u
left join public.academias a on a.codigo = 'ASD123'
where u.email in ('encinaacevedo.pablo@gmail.com', 'encinaaceevdo.pablo@gmail.com')
on conflict (id) do update set
  role = 'super_admin',
  full_name = excluded.full_name,
  email = excluded.email;

-- =========================================
-- RLS SIMPLE PARA MVP
-- =========================================

alter table public.academias enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "academias_all_authenticated" on public.academias;
drop policy if exists "academias_public_read_codes" on public.academias;
drop policy if exists "profiles_select_authenticated" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

-- Permite validar código de academia antes/después del registro
create policy "academias_public_read_codes"
on public.academias
for select
to anon, authenticated
using (is_active = true);

create policy "academias_all_authenticated"
on public.academias
for all
to authenticated
using (true)
with check (true);

create policy "profiles_select_authenticated"
on public.profiles
for select
to authenticated
using (true);

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);
