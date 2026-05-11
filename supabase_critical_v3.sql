-- ================================================================
-- CALFIT — CRÍTICO v3: rutinas, mensajes y panel alumno
-- Ejecutar completo en Supabase > SQL Editor
-- Compatible con roles existentes: 'profe' y 'alumno'
-- ================================================================

create extension if not exists "pgcrypto";

-- 1) PLANES / ORGANIZACIONES / MEMBRESÍAS
create table if not exists public.plans (
  id text primary key,
  name text not null,
  price_monthly int not null default 0,
  price_yearly int not null default 0,
  max_alumnos int not null default 10,
  features jsonb default '[]'::jsonb,
  active boolean default true,
  created_at timestamptz default now()
);

insert into public.plans (id, name, price_monthly, price_yearly, max_alumnos, features)
values
  ('starter','Starter',18000,145000,10,'["Hasta 10 alumnos","Rutinas","Mensajería"]'),
  ('pro','Pro',37000,295000,50,'["Hasta 50 alumnos","Métricas","Videos"]'),
  ('elite','Elite',65000,520000,999,'["Alumnos ilimitados","White label"]')
on conflict (id) do update set
  name = excluded.name,
  price_monthly = excluded.price_monthly,
  price_yearly = excluded.price_yearly,
  max_alumnos = excluded.max_alumnos,
  features = excluded.features;

create table if not exists public.organizations (
  id bigserial primary key,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  slug text unique not null,
  logo_url text,
  primary_color text default '#c8f542',
  plan_id text default 'starter' references public.plans(id),
  plan_status text default 'trialing' check (plan_status in ('trialing','active','past_due','canceled')),
  trial_ends_at timestamptz default (now() + interval '14 days'),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.memberships (
  id bigserial primary key,
  org_id bigint not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner','coach','alumno')),
  status text default 'active' check (status in ('active','inactive','invited')),
  joined_at timestamptz default now(),
  unique (org_id, user_id)
);

-- 2) RUTINAS / EJERCICIOS / SESIONES
create table if not exists public.rutinas (
  id bigserial primary key,
  org_id bigint not null references public.organizations(id) on delete cascade,
  alumno_id uuid not null references public.profiles(id) on delete cascade,
  profe_id uuid not null references public.profiles(id) on delete cascade,
  nombre text not null,
  descripcion text,
  categoria text default 'general',
  activa boolean default true,
  semana int default 1,
  orden int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.ejercicios (
  id bigserial primary key,
  rutina_id bigint not null references public.rutinas(id) on delete cascade,
  nombre text not null,
  tipo text not null default 'series',
  series int default 4,
  reps text,
  duracion_s int,
  descanso_s int default 90,
  rir int,
  rpe int,
  video_url text,
  imagen_url text,
  notas text,
  orden int default 0,
  created_at timestamptz default now()
);

create table if not exists public.sesiones (
  id bigserial primary key,
  org_id bigint not null references public.organizations(id) on delete cascade,
  alumno_id uuid not null references public.profiles(id) on delete cascade,
  rutina_id bigint not null references public.rutinas(id) on delete cascade,
  fecha date default current_date,
  completada boolean default false,
  duracion_min int,
  calorias int,
  percepcion_esfuerzo int,
  notas text,
  created_at timestamptz default now()
);

-- 3) MENSAJERÍA
create table if not exists public.conversations (
  id bigserial primary key,
  org_id bigint not null references public.organizations(id) on delete cascade,
  profe_id uuid not null references public.profiles(id) on delete cascade,
  alumno_id uuid not null references public.profiles(id) on delete cascade,
  last_message_at timestamptz default now(),
  created_at timestamptz default now(),
  unique (org_id, profe_id, alumno_id)
);

create table if not exists public.messages (
  id bigserial primary key,
  conversation_id bigint not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  tipo text default 'text',
  read_at timestamptz,
  created_at timestamptz default now()
);

-- 4) Funciones seguras para RLS
create or replace function public.current_user_org_id()
returns bigint
language sql stable security definer
set search_path = public
as $$
  select m.org_id
  from public.memberships m
  where m.user_id = auth.uid()
    and m.status = 'active'
  order by case when m.role in ('owner','coach') then 0 else 1 end
  limit 1;
$$;

create or replace function public.is_coach_in_org(o_id bigint)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    where m.user_id = auth.uid()
      and m.org_id = o_id
      and m.role in ('owner','coach')
      and m.status = 'active'
  );
$$;

create or replace function public.is_member_in_org(o_id bigint)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    where m.user_id = auth.uid()
      and m.org_id = o_id
      and m.status = 'active'
  );
$$;

-- 5) Crear organización/membership para profes existentes que no tengan
insert into public.organizations (owner_id, name, slug, plan_id, plan_status)
select
  p.id,
  coalesce(nullif(p.full_name,''), split_part(p.email,'@',1), 'Mi Academia'),
  lower(regexp_replace(coalesce(nullif(p.full_name,''), split_part(p.email,'@',1), p.id::text), '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(p.id::text, 1, 6),
  'starter',
  'trialing'
from public.profiles p
where p.role = 'profe'
  and not exists (select 1 from public.organizations o where o.owner_id = p.id)
on conflict (slug) do nothing;

insert into public.memberships (org_id, user_id, role, status)
select o.id, o.owner_id, 'owner', 'active'
from public.organizations o
where not exists (
  select 1 from public.memberships m where m.org_id = o.id and m.user_id = o.owner_id
)
on conflict (org_id, user_id) do nothing;

-- 6) RLS limpia, sin recursión directa en profiles
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.rutinas enable row level security;
alter table public.ejercicios enable row level security;
alter table public.sesiones enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

do $$
declare r record;
begin
  for r in select policyname from pg_policies where schemaname='public' and tablename='profiles' loop
    execute format('drop policy if exists %I on public.profiles', r.policyname);
  end loop;
  for r in select policyname from pg_policies where schemaname='public' and tablename='organizations' loop
    execute format('drop policy if exists %I on public.organizations', r.policyname);
  end loop;
  for r in select policyname from pg_policies where schemaname='public' and tablename='memberships' loop
    execute format('drop policy if exists %I on public.memberships', r.policyname);
  end loop;
  for r in select policyname from pg_policies where schemaname='public' and tablename in ('rutinas','ejercicios','sesiones','conversations','messages') loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

create policy "profiles_select_own" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (auth.uid() = id);

create policy "organizations_select_member" on public.organizations for select to authenticated using (public.is_member_in_org(id) or owner_id = auth.uid());
create policy "organizations_update_owner" on public.organizations for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "memberships_select_member_org" on public.memberships for select to authenticated using (public.is_member_in_org(org_id));
create policy "memberships_insert_coach" on public.memberships for insert to authenticated with check (public.is_coach_in_org(org_id));
create policy "memberships_update_coach" on public.memberships for update to authenticated using (public.is_coach_in_org(org_id)) with check (public.is_coach_in_org(org_id));

create policy "rutinas_select_student_or_coach" on public.rutinas for select to authenticated using (alumno_id = auth.uid() or public.is_coach_in_org(org_id));
create policy "rutinas_insert_coach" on public.rutinas for insert to authenticated with check (profe_id = auth.uid() and public.is_coach_in_org(org_id));
create policy "rutinas_update_coach" on public.rutinas for update to authenticated using (public.is_coach_in_org(org_id)) with check (public.is_coach_in_org(org_id));
create policy "rutinas_delete_coach" on public.rutinas for delete to authenticated using (public.is_coach_in_org(org_id));

create policy "ejercicios_select_by_rutina" on public.ejercicios for select to authenticated using (exists (select 1 from public.rutinas r where r.id = rutina_id and (r.alumno_id = auth.uid() or public.is_coach_in_org(r.org_id))));
create policy "ejercicios_insert_coach" on public.ejercicios for insert to authenticated with check (exists (select 1 from public.rutinas r where r.id = rutina_id and public.is_coach_in_org(r.org_id)));
create policy "ejercicios_update_coach" on public.ejercicios for update to authenticated using (exists (select 1 from public.rutinas r where r.id = rutina_id and public.is_coach_in_org(r.org_id))) with check (exists (select 1 from public.rutinas r where r.id = rutina_id and public.is_coach_in_org(r.org_id)));
create policy "ejercicios_delete_coach" on public.ejercicios for delete to authenticated using (exists (select 1 from public.rutinas r where r.id = rutina_id and public.is_coach_in_org(r.org_id)));

create policy "sesiones_select_student_or_coach" on public.sesiones for select to authenticated using (alumno_id = auth.uid() or public.is_coach_in_org(org_id));
create policy "sesiones_insert_student" on public.sesiones for insert to authenticated with check (alumno_id = auth.uid());
create policy "sesiones_update_student" on public.sesiones for update to authenticated using (alumno_id = auth.uid()) with check (alumno_id = auth.uid());

create policy "conversations_select_participant" on public.conversations for select to authenticated using (profe_id = auth.uid() or alumno_id = auth.uid());
create policy "conversations_insert_coach" on public.conversations for insert to authenticated with check (profe_id = auth.uid() and public.is_coach_in_org(org_id));
create policy "conversations_insert_student" on public.conversations for insert to authenticated with check (alumno_id = auth.uid() and public.is_member_in_org(org_id));

create policy "messages_select_participant" on public.messages for select to authenticated using (exists (select 1 from public.conversations c where c.id = conversation_id and (c.profe_id = auth.uid() or c.alumno_id = auth.uid())));
create policy "messages_insert_participant" on public.messages for insert to authenticated with check (sender_id = auth.uid() and exists (select 1 from public.conversations c where c.id = conversation_id and (c.profe_id = auth.uid() or c.alumno_id = auth.uid())));

-- 7) Trigger timestamp mensajes
create or replace function public.update_conversation_timestamp()
returns trigger language plpgsql security definer as $$
begin
  update public.conversations set last_message_at = now() where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists messages_update_convo on public.messages;
create trigger messages_update_convo
after insert on public.messages
for each row execute function public.update_conversation_timestamp();

-- 8) Opcional realtime
alter publication supabase_realtime add table public.messages;
