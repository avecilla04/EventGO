-- =====================================================================
-- EventGo · 002 · Estadísticas de seguidores para los comerciantes
-- Ejecutar en: Dashboard > SQL Editor > New query > Run
-- (ya incluido en schema.sql para proyectos nuevos)
-- =====================================================================
--
-- Las reglas de venue_follows solo dejan a cada usuario ver sus propios
-- seguimientos. Esta función devuelve al comerciante los TOTALES de sus
-- locales, sin revelar quién los sigue.

create or replace function public.my_venue_stats()
returns table (venue_id uuid, followers bigint, new_followers_7d bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select
    v.id,
    count(f.user_id),
    count(f.user_id) filter (where f.created_at > now() - interval '7 days')
  from public.venues v
  left join public.venue_follows f on f.venue_id = v.id
  where v.user_id = auth.uid()
  group by v.id;
$$;

revoke execute on function public.my_venue_stats() from public, anon;
grant execute on function public.my_venue_stats() to authenticated;
