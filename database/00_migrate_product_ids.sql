-- POLCARFER · MIGRACIÓN ÚNICA CORREGIDA
-- Convierte el modelo anterior (codigo = primary key) al modelo correcto:
-- id interno UUID = primary key; codigo comercial puede repetirse.
--
-- IMPORTANTE:
-- La tabla products está publicada en Supabase Realtime.
-- Por eso primero usamos REPLICA IDENTITY FULL antes de quitar la PK anterior.

rollback;

begin;

-- Mientras cambiamos la PK, PostgreSQL necesita una identidad de réplica
-- para permitir UPDATE sobre una tabla publicada en Realtime.
alter table public.products replica identity full;

-- Quita la PK anterior basada en codigo.
alter table public.products
  drop constraint if exists products_pkey;

-- Nueva identidad interna e independiente del código comercial.
alter table public.products
  add column if not exists id uuid default gen_random_uuid();

update public.products
set id = gen_random_uuid()
where id is null;

alter table public.products
  alter column id set default gen_random_uuid(),
  alter column id set not null;

alter table public.products
  add column if not exists activo boolean not null default true;

-- Evita un error si una ejecución anterior alcanzó a crear la PK.
alter table public.products
  drop constraint if exists products_pkey;

alter table public.products
  add constraint products_pkey primary key (id);

-- Ya existe nuevamente una PK estable: Realtime puede usarla.
alter table public.products replica identity default;

create index if not exists products_codigo_idx
  on public.products (codigo);

create index if not exists products_activo_idx
  on public.products (activo);

create index if not exists products_codigo_nombre_idx
  on public.products (codigo, nombre);

-- Clientes ven productos activos; socios pueden ver todo.
drop policy if exists "public can read products" on public.products;

create policy "public can read products"
on public.products
for select
to anon, authenticated
using (activo = true or public.is_socio());

commit;
