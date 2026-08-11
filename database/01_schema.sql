-- POLCARFER · Base compartida para portal de clientes + portal de socios
-- MODELO CORREGIDO: el código comercial PUEDE REPETIRSE.
-- La identidad real del producto es id (UUID interno generado por la base).

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  codigo text not null,
  nombre text not null,
  presentacion text not null default '',
  rubro text not null default 'General',
  seccion text not null default '',
  precio_lista numeric not null default 0,
  precio_sin_iva numeric not null default 0,
  precio_con_iva numeric not null default 0,
  descuento numeric not null default 0,
  precio_sin_iva_descuento numeric not null default 0,
  precio_con_iva_descuento numeric not null default 0,
  stock numeric null,
  activo boolean not null default true,
  origen text not null default 'CATÁLOGO',
  updated_at timestamptz not null default now()
);

create index if not exists products_codigo_idx on public.products (codigo);
create index if not exists products_activo_idx on public.products (activo);
create index if not exists products_codigo_nombre_idx on public.products (codigo, nombre);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'viewer' check (role in ('viewer','socio')),
  display_name text
);

alter table public.products enable row level security;
alter table public.profiles enable row level security;

grant select on table public.products to anon, authenticated;
grant insert, update, delete on table public.products to authenticated;
grant select on table public.profiles to authenticated;

create or replace function public.is_socio()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'socio');
$$;

grant execute on function public.is_socio() to authenticated;

drop policy if exists "public can read products" on public.products;
create policy "public can read products" on public.products for select to anon, authenticated using (activo = true or public.is_socio());

drop policy if exists "socios can insert products" on public.products;
create policy "socios can insert products" on public.products for insert to authenticated with check (public.is_socio());

drop policy if exists "socios can update products" on public.products;
create policy "socios can update products" on public.products for update to authenticated using (public.is_socio()) with check (public.is_socio());

drop policy if exists "socios can delete products" on public.products;
create policy "socios can delete products" on public.products for delete to authenticated using (public.is_socio());

drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile" on public.profiles for select to authenticated using (id = auth.uid());

-- Realtime: permite que una lista abierta se actualice al cambiar productos.
do $$ begin
  alter publication supabase_realtime add table public.products;
exception when duplicate_object then null;
end $$;
