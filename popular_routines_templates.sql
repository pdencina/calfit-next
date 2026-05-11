-- =====================================================
-- CALFIT - Plantillas populares de calistenia
-- Ejecutar en Supabase SQL Editor
-- =====================================================

create extension if not exists "pgcrypto";

-- Asegurar columnas necesarias
alter table public.routines add column if not exists nivel text;
alter table public.routines add column if not exists categoria text;
alter table public.routines add column if not exists is_template boolean default false;
alter table public.routines add column if not exists objetivo text;
alter table public.routines add column if not exists duracion_min integer default 45;

alter table public.routine_exercises add column if not exists video_url text;
alter table public.routine_exercises add column if not exists orden integer default 0;
alter table public.routine_exercises add column if not exists notas text;

-- Limpia plantillas anteriores CALFIT para evitar duplicados
with old_templates as (
  select id from public.routines where is_template = true
)
delete from public.routine_exercises
where routine_id in (select id from old_templates);

delete from public.routines where is_template = true;

-- Insertar rutinas template
insert into public.routines (
  id, titulo, descripcion, nivel, categoria, objetivo, duracion_min, is_template, created_at
)
values
(gen_random_uuid(), 'Fundamentos Calistenia', 'Rutina base para alumnos nuevos: empuje, tracción, piernas y core.', 'Principiante', 'Full Body', 'Crear base física y técnica', 45, true, now()),
(gen_random_uuid(), 'Primer Pull Up', 'Progresión para lograr la primera dominada estricta.', 'Principiante', 'Pull', 'Desarrollar fuerza de espalda y agarre', 40, true, now()),
(gen_random_uuid(), 'Push Power', 'Rutina enfocada en flexiones, fondos y fuerza de empuje.', 'Principiante', 'Push', 'Mejorar pecho, hombros y tríceps', 45, true, now()),
(gen_random_uuid(), 'Core Beast', 'Entrenamiento intenso para abdomen, estabilidad y control corporal.', 'Intermedio', 'Core', 'Fortalecer core para skills', 35, true, now()),
(gen_random_uuid(), 'Dominadas Explosivas', 'Rutina para mejorar potencia, control y volumen en dominadas.', 'Intermedio', 'Pull', 'Subir repeticiones y explosividad', 50, true, now()),
(gen_random_uuid(), 'Muscle Up Progression', 'Progresión completa para trabajar el primer muscle up.', 'Intermedio', 'Skill', 'Lograr transición y tirón explosivo', 55, true, now()),
(gen_random_uuid(), 'Handstand Control', 'Rutina para equilibrio, hombros y línea corporal en handstand.', 'Intermedio', 'Skill', 'Mejorar parada de manos', 45, true, now()),
(gen_random_uuid(), 'Piernas Funcionales', 'Trabajo de piernas con potencia, unilateralidad y resistencia.', 'Principiante', 'Legs', 'Fortalecer tren inferior', 40, true, now()),
(gen_random_uuid(), 'Front Lever Base', 'Progresión inicial para front lever con énfasis en dorsales y core.', 'Intermedio', 'Skill', 'Construir front lever tuck sólido', 50, true, now()),
(gen_random_uuid(), 'Street Workout Pro', 'Rutina avanzada full body con volumen e intensidad.', 'Avanzado', 'Full Body', 'Alto rendimiento street workout', 60, true, now());

-- Ejercicios por rutina
insert into public.routine_exercises (routine_id, nombre, sets, reps, descanso, orden, notas)
select r.id, x.nombre, x.sets, x.reps, x.descanso, x.orden, x.notas
from public.routines r
cross join lateral (values
  ('Jumping Jacks', 3, 30, 30, 1, 'Activación general'),
  ('Push Ups', 4, 12, 60, 2, 'Controlar bajada'),
  ('Australian Pull Ups', 4, 10, 60, 3, 'Pecho hacia la barra'),
  ('Squats', 4, 20, 60, 4, 'Rango completo'),
  ('Plank', 3, 45, 45, 5, 'Mantener abdomen firme')
) as x(nombre, sets, reps, descanso, orden, notas)
where r.titulo = 'Fundamentos Calistenia' and r.is_template = true;

insert into public.routine_exercises (routine_id, nombre, sets, reps, descanso, orden, notas)
select r.id, x.nombre, x.sets, x.reps, x.descanso, x.orden, x.notas
from public.routines r
cross join lateral (values
  ('Dead Hang', 4, 30, 60, 1, 'Segundos colgado'),
  ('Scapular Pull Ups', 4, 10, 60, 2, 'Solo escápulas'),
  ('Australian Pull Ups', 4, 12, 60, 3, 'Cuerpo recto'),
  ('Negative Pull Ups', 5, 5, 90, 4, 'Bajada lenta 4 segundos'),
  ('Assisted Pull Ups', 4, 6, 90, 5, 'Con banda si aplica')
) as x(nombre, sets, reps, descanso, orden, notas)
where r.titulo = 'Primer Pull Up' and r.is_template = true;

insert into public.routine_exercises (routine_id, nombre, sets, reps, descanso, orden, notas)
select r.id, x.nombre, x.sets, x.reps, x.descanso, x.orden, x.notas
from public.routines r
cross join lateral (values
  ('Incline Push Ups', 3, 15, 45, 1, 'Calentamiento'),
  ('Push Ups', 5, 12, 75, 2, 'Técnica estricta'),
  ('Dips', 4, 8, 90, 3, 'Fondos controlados'),
  ('Pike Push Ups', 4, 8, 90, 4, 'Hombros'),
  ('Diamond Push Ups', 3, 10, 75, 5, 'Tríceps')
) as x(nombre, sets, reps, descanso, orden, notas)
where r.titulo = 'Push Power' and r.is_template = true;

insert into public.routine_exercises (routine_id, nombre, sets, reps, descanso, orden, notas)
select r.id, x.nombre, x.sets, x.reps, x.descanso, x.orden, x.notas
from public.routines r
cross join lateral (values
  ('Hollow Body Hold', 4, 30, 45, 1, 'Segundos'),
  ('Leg Raises', 4, 12, 60, 2, 'Sin balanceo'),
  ('Plank', 4, 60, 45, 3, 'Segundos'),
  ('Side Plank', 3, 30, 45, 4, 'Por lado'),
  ('Mountain Climbers', 4, 30, 30, 5, 'Reps totales')
) as x(nombre, sets, reps, descanso, orden, notas)
where r.titulo = 'Core Beast' and r.is_template = true;

insert into public.routine_exercises (routine_id, nombre, sets, reps, descanso, orden, notas)
select r.id, x.nombre, x.sets, x.reps, x.descanso, x.orden, x.notas
from public.routines r
cross join lateral (values
  ('Dead Hang', 3, 40, 60, 1, 'Segundos'),
  ('Pull Ups', 5, 6, 90, 2, 'Dominada estricta'),
  ('Chest To Bar Pull Ups', 4, 5, 120, 3, 'Explosividad'),
  ('Negative Pull Ups', 3, 5, 90, 4, 'Control excéntrico'),
  ('Australian Pull Ups', 3, 15, 60, 5, 'Finisher')
) as x(nombre, sets, reps, descanso, orden, notas)
where r.titulo = 'Dominadas Explosivas' and r.is_template = true;

insert into public.routine_exercises (routine_id, nombre, sets, reps, descanso, orden, notas)
select r.id, x.nombre, x.sets, x.reps, x.descanso, x.orden, x.notas
from public.routines r
cross join lateral (values
  ('Explosive Pull Ups', 5, 5, 120, 1, 'Subir lo más alto posible'),
  ('Chest To Bar Pull Ups', 5, 4, 120, 2, 'Pecho a barra'),
  ('Straight Bar Dips', 5, 6, 90, 3, 'Fondos en barra'),
  ('Jumping Muscle Up', 4, 5, 90, 4, 'Practicar transición'),
  ('Band Assisted Muscle Up', 4, 3, 120, 5, 'Con banda')
) as x(nombre, sets, reps, descanso, orden, notas)
where r.titulo = 'Muscle Up Progression' and r.is_template = true;

insert into public.routine_exercises (routine_id, nombre, sets, reps, descanso, orden, notas)
select r.id, x.nombre, x.sets, x.reps, x.descanso, x.orden, x.notas
from public.routines r
cross join lateral (values
  ('Wall Handstand Hold', 5, 30, 60, 1, 'Segundos'),
  ('Shoulder Taps Wall', 4, 10, 75, 2, 'Alternados'),
  ('Pike Push Ups', 4, 8, 90, 3, 'Fuerza hombros'),
  ('Hollow Body Hold', 3, 30, 45, 4, 'Línea corporal'),
  ('Freestanding Attempts', 8, 1, 45, 5, 'Intentos controlados')
) as x(nombre, sets, reps, descanso, orden, notas)
where r.titulo = 'Handstand Control' and r.is_template = true;

insert into public.routine_exercises (routine_id, nombre, sets, reps, descanso, orden, notas)
select r.id, x.nombre, x.sets, x.reps, x.descanso, x.orden, x.notas
from public.routines r
cross join lateral (values
  ('Squats', 5, 20, 60, 1, 'Rango completo'),
  ('Lunges', 4, 12, 60, 2, 'Por pierna'),
  ('Bulgarian Split Squats', 4, 10, 75, 3, 'Por pierna'),
  ('Calf Raises', 4, 20, 45, 4, 'Gemelos'),
  ('Wall Sit', 3, 60, 60, 5, 'Segundos')
) as x(nombre, sets, reps, descanso, orden, notas)
where r.titulo = 'Piernas Funcionales' and r.is_template = true;

insert into public.routine_exercises (routine_id, nombre, sets, reps, descanso, orden, notas)
select r.id, x.nombre, x.sets, x.reps, x.descanso, x.orden, x.notas
from public.routines r
cross join lateral (values
  ('Scapular Pull Ups', 4, 10, 60, 1, 'Activar espalda'),
  ('Tuck Front Lever Hold', 5, 12, 90, 2, 'Segundos'),
  ('Front Lever Raises Tuck', 4, 6, 90, 3, 'Control'),
  ('Hollow Body Hold', 4, 35, 45, 4, 'Segundos'),
  ('Australian Pull Ups', 4, 12, 60, 5, 'Volumen')
) as x(nombre, sets, reps, descanso, orden, notas)
where r.titulo = 'Front Lever Base' and r.is_template = true;

insert into public.routine_exercises (routine_id, nombre, sets, reps, descanso, orden, notas)
select r.id, x.nombre, x.sets, x.reps, x.descanso, x.orden, x.notas
from public.routines r
cross join lateral (values
  ('Pull Ups', 5, 10, 90, 1, 'Fuerza tracción'),
  ('Dips', 5, 12, 90, 2, 'Empuje'),
  ('Pistol Squat Progression', 4, 6, 90, 3, 'Por pierna'),
  ('Toes To Bar', 4, 10, 75, 4, 'Core'),
  ('Burpees', 5, 12, 60, 5, 'Condición')
) as x(nombre, sets, reps, descanso, orden, notas)
where r.titulo = 'Street Workout Pro' and r.is_template = true;

-- RLS flexible para MVP si hay bloqueo al leer plantillas
alter table public.routines enable row level security;
alter table public.routine_exercises enable row level security;

drop policy if exists "routines_all_authenticated" on public.routines;
create policy "routines_all_authenticated"
on public.routines
for all
to authenticated
using (true)
with check (true);

drop policy if exists "routine_exercises_all_authenticated" on public.routine_exercises;
create policy "routine_exercises_all_authenticated"
on public.routine_exercises
for all
to authenticated
using (true)
with check (true);
