-- =========================================
-- CALFIT - Panel Super Admin
-- Ejecutar en Supabase SQL Editor
-- =========================================

create extension if not exists "pgcrypto";

-- Asegura columnas necesarias en academias sin romper lo existente
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
  codigo = coalesce(codigo, 'ASD123'),
  color = coalesce(color, '#c8f542'),
  plan = coalesce(plan, 'founder'),
  is_active = coalesce(is_active, true);

-- Índice único seguro para código
create unique index if not exists academias_codigo_unique_idx
on public.academias (codigo)
where codigo is not null;

insert into public.academias (name, nombre, codigo, color, plan, is_active)
values ('CALFIT Demo', 'CALFIT Demo', 'ASD123', '#c8f542', 'founder', true)
on conflict do nothing;

-- Asegura columnas necesarias en profiles
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists role text default 'alumno';
alter table public.profiles add column if not exists academia_id uuid;
alter table public.profiles add column if not exists created_at timestamptz default now();

-- Roles SaaS
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
check (role in ('super_admin', 'admin', 'profe', 'alumno'));

-- Tu usuario como super_admin
update public.profiles
set role = 'super_admin',
    full_name = coalesce(full_name, 'Pablo Encina'),
    email = coalesce(email, 'encinaacevedo.pablo@gmail.com')
where email in ('encinaacevedo.pablo@gmail.com', 'encinaaceevdo.pablo@gmail.com');

-- Policies simples para esta fase MVP
alter table public.academias enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "academias_all_authenticated" on public.academias;
drop policy if exists "profiles_select_authenticated" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

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

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);
