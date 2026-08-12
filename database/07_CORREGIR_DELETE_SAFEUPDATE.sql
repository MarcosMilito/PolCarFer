-- POLCARFER · Ofertas separadas + importación atómica
-- Ejecutar UNA SOLA VEZ en Supabase > SQL Editor.
-- No borra productos ni usuarios existentes.

create table if not exists public.product_offers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  condicion text not null default '',
  cantidad_minima numeric null,
  descuento numeric not null default 0,
  precio_lista_origen numeric not null default 0,
  precio_sin_iva numeric not null default 0,
  precio_con_iva numeric not null default 0,
  requiere_revision boolean not null default false,
  activa boolean not null default true,
  origen text not null default 'LISTA CON DESCUENTOS',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists product_offers_product_id_idx
  on public.product_offers(product_id);
create index if not exists product_offers_activa_idx
  on public.product_offers(activa);

alter table public.product_offers enable row level security;

grant select on table public.product_offers to anon, authenticated;
grant insert, update, delete on table public.product_offers to authenticated;

drop policy if exists "public can read active offers" on public.product_offers;
create policy "public can read active offers"
on public.product_offers
for select
to anon, authenticated
using (
  activa = true
  and exists (
    select 1
    from public.products p
    where p.id = product_id
      and p.activo = true
  )
);

drop policy if exists "socios can read all offers" on public.product_offers;
create policy "socios can read all offers"
on public.product_offers
for select
to authenticated
using (public.is_socio());

drop policy if exists "socios can insert offers" on public.product_offers;
create policy "socios can insert offers"
on public.product_offers
for insert
to authenticated
with check (public.is_socio());

drop policy if exists "socios can update offers" on public.product_offers;
create policy "socios can update offers"
on public.product_offers
for update
to authenticated
using (public.is_socio())
with check (public.is_socio());

drop policy if exists "socios can delete offers" on public.product_offers;
create policy "socios can delete offers"
on public.product_offers
for delete
to authenticated
using (public.is_socio());

-- Importa el catálogo completo dentro de UNA sola transacción PostgreSQL.
-- Si una fila falla, no queda media lista publicada.
create or replace function public.replace_catalog_atomic(
  p_products jsonb,
  p_offers jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  offer_item jsonb;
  v_id uuid;
  v_key text;
  v_map jsonb := '{}'::jsonb;
  v_products_count integer := 0;
  v_offers_count integer := 0;
begin
  if not public.is_socio() then
    raise exception 'No autorizado: se requiere perfil de socio.';
  end if;

  if p_products is null or jsonb_typeof(p_products) <> 'array' then
    raise exception 'p_products debe ser un array JSON.';
  end if;

  if p_offers is null then
    p_offers := '[]'::jsonb;
  end if;

  if jsonb_typeof(p_offers) <> 'array' then
    raise exception 'p_offers debe ser un array JSON.';
  end if;

  -- Modo reemplazo: lo que ya no está en el Excel deja de ser público.
  update public.products
     set activo = false,
         updated_at = now()
   where activo = true;

  -- Las ofertas son condiciones vigentes de la lista nueva.
  delete from public.product_offers
   where id is not null;

  for item in
    select value from jsonb_array_elements(p_products)
  loop
    v_key := nullif(item->>'import_key', '');
    if v_key is null then
      raise exception 'Producto sin import_key: %', item;
    end if;

    if coalesce(item->>'id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
      v_id := (item->>'id')::uuid;
    else
      v_id := gen_random_uuid();
    end if;

    insert into public.products (
      id,
      codigo,
      nombre,
      presentacion,
      rubro,
      seccion,
      precio_lista,
      precio_sin_iva,
      precio_con_iva,
      descuento,
      precio_sin_iva_descuento,
      precio_con_iva_descuento,
      stock,
      activo,
      origen,
      updated_at
    ) values (
      v_id,
      coalesce(item->>'codigo', ''),
      coalesce(item->>'nombre', ''),
      coalesce(item->>'presentacion', ''),
      coalesce(nullif(item->>'rubro', ''), 'General'),
      coalesce(item->>'seccion', ''),
      coalesce(nullif(item->>'precio_lista', '')::numeric, 0),
      coalesce(nullif(item->>'precio_sin_iva', '')::numeric, 0),
      coalesce(nullif(item->>'precio_con_iva', '')::numeric, 0),
      0,
      0,
      0,
      nullif(item->>'stock', '')::numeric,
      true,
      coalesce(nullif(item->>'origen', ''), 'IMPORTADO EXCEL'),
      now()
    )
    on conflict (id) do update set
      codigo = excluded.codigo,
      nombre = excluded.nombre,
      presentacion = excluded.presentacion,
      rubro = excluded.rubro,
      seccion = excluded.seccion,
      precio_lista = excluded.precio_lista,
      precio_sin_iva = excluded.precio_sin_iva,
      precio_con_iva = excluded.precio_con_iva,
      descuento = 0,
      precio_sin_iva_descuento = 0,
      precio_con_iva_descuento = 0,
      stock = excluded.stock,
      activo = true,
      origen = excluded.origen,
      updated_at = now()
    returning id into v_id;

    v_map := v_map || jsonb_build_object(v_key, v_id::text);
    v_products_count := v_products_count + 1;
  end loop;

  for offer_item in
    select value from jsonb_array_elements(p_offers)
  loop
    v_key := nullif(offer_item->>'product_key', '');
    v_id := nullif(v_map ->> v_key, '')::uuid;

    if v_id is null then
      raise exception 'Oferta sin producto vinculado. product_key=%', v_key;
    end if;

    insert into public.product_offers (
      product_id,
      condicion,
      cantidad_minima,
      descuento,
      precio_lista_origen,
      precio_sin_iva,
      precio_con_iva,
      requiere_revision,
      activa,
      origen,
      updated_at
    ) values (
      v_id,
      coalesce(offer_item->>'condicion', ''),
      nullif(offer_item->>'cantidad_minima', '')::numeric,
      coalesce(nullif(offer_item->>'descuento', '')::numeric, 0),
      coalesce(nullif(offer_item->>'precio_lista_origen', '')::numeric, 0),
      coalesce(nullif(offer_item->>'precio_sin_iva', '')::numeric, 0),
      coalesce(nullif(offer_item->>'precio_con_iva', '')::numeric, 0),
      coalesce((offer_item->>'requiere_revision')::boolean, false),
      true,
      coalesce(nullif(offer_item->>'origen', ''), 'LISTA CON DESCUENTOS'),
      now()
    );

    v_offers_count := v_offers_count + 1;
  end loop;

  return jsonb_build_object(
    'products', v_products_count,
    'offers', v_offers_count
  );
end;
$$;

grant execute on function public.replace_catalog_atomic(jsonb, jsonb)
to authenticated;

-- Realtime para que una lista abierta pueda reflejar cambios de ofertas.
do $$
begin
  alter publication supabase_realtime add table public.product_offers;
exception
  when duplicate_object then null;
end $$;
