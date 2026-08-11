-- POLCARFER · NOVEDADES
-- Ejecutar UNA SOLA VEZ en Supabase > SQL Editor.
--
-- Antes o después de ejecutar este SQL:
-- 1) Supabase > Storage > New bucket
-- 2) Nombre exacto: novedades
-- 3) Marcarlo como PUBLIC
-- 4) Limitar tipos a image/jpeg, image/png, image/webp
-- 5) Tamaño máximo recomendado: 5 MB
--
-- No hace falta crear columnas manualmente.

begin;

create table if not exists public.novedades (
  id uuid primary key default gen_random_uuid(),
  titulo text not null check (char_length(titulo) between 1 and 140),
  descripcion text not null default '' check (char_length(descripcion) <= 1000),
  imagen_url text not null,
  imagen_path text not null,
  activo boolean not null default true,
  creado_por uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.novedades enable row level security;

drop policy if exists "public can read active news" on public.novedades;
create policy "public can read active news"
on public.novedades
for select
to anon, authenticated
using (
  activo = true
  or public.is_socio()
);

drop policy if exists "partners can insert news" on public.novedades;
create policy "partners can insert news"
on public.novedades
for insert
to authenticated
with check (public.is_socio());

drop policy if exists "partners can update news" on public.novedades;
create policy "partners can update news"
on public.novedades
for update
to authenticated
using (public.is_socio())
with check (public.is_socio());

drop policy if exists "partners can delete news" on public.novedades;
create policy "partners can delete news"
on public.novedades
for delete
to authenticated
using (public.is_socio());

-- Storage: el bucket "novedades" debe crearse desde el Dashboard.
-- Las políticas siguientes permiten que solo los socios autenticados
-- administren sus archivos. Las imágenes se sirven por URL pública.

drop policy if exists "partners can read news storage" on storage.objects;
create policy "partners can read news storage"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'novedades'
  and public.is_socio()
);

drop policy if exists "partners can upload news images" on storage.objects;
create policy "partners can upload news images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'novedades'
  and public.is_socio()
);

drop policy if exists "partners can update news images" on storage.objects;
create policy "partners can update news images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'novedades'
  and public.is_socio()
)
with check (
  bucket_id = 'novedades'
  and public.is_socio()
);

drop policy if exists "partners can delete news images" on storage.objects;
create policy "partners can delete news images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'novedades'
  and public.is_socio()
);

-- Realtime para que una pestaña Novedades abierta se refresque automáticamente.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'novedades'
  ) then
    alter publication supabase_realtime add table public.novedades;
  end if;
end
$$;

commit;
