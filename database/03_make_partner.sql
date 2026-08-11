-- 1) Primero creá el usuario del socio en Supabase > Authentication > Users.
-- 2) Después reemplazá el email de abajo y ejecutá este SQL.

insert into public.profiles (id, role, display_name)
select id, 'socio', 'Socio POLCARFER'
from auth.users
where email = 'administracion@polcarfer.com'
on conflict (id) do update set role='socio', display_name=excluded.display_name;
