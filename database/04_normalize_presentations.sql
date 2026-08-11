-- POLCARFER · NORMALIZACIÓN ÚNICA DE PRESENTACIONES YA CARGADAS
-- Ejecutar una sola vez.
-- Solo modifica presentaciones que son cantidades puras.
-- No toca medidas ni textos complejos (por ejemplo: "6 UNIDADES 22 MM X 1,20 MTS").

begin;

update public.products
set presentacion='1 unidad', updated_at=now()
where upper(trim(presentacion))='UNIDAD';

update public.products
set presentacion='Unidades', updated_at=now()
where upper(trim(presentacion))='UNIDADES';

update public.products
set presentacion = case
  when replace(trim(presentacion), ',', '.')::numeric = 1 then '1 unidad'
  else trim(presentacion) || ' unidades'
end,
updated_at=now()
where trim(presentacion) ~ '^[0-9]+([\.,][0-9]+)?$';

update public.products
set presentacion = case
  when replace(split_part(trim(presentacion), ' ', 1), ',', '.')::numeric = 1 then '1 unidad'
  else split_part(trim(presentacion), ' ', 1) || ' unidades'
end,
updated_at=now()
where upper(trim(presentacion)) ~ '^[0-9]+([\.,][0-9]+)?[[:space:]]+UNIDADES?$';

commit;