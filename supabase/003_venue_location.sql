-- =====================================================================
-- EventGo · 003 · Ubicación de los locales (ciudad y coordenadas)
-- Ejecutar en: Dashboard > SQL Editor > New query > Run
-- (ya incluido en schema.sql para proyectos nuevos)
-- =====================================================================
--
-- city    -> para buscar planes por ciudad ("¿qué hago en Málaga este finde?")
-- lat/lng -> para ordenar por cercanía ("cerca de mí"). Se obtienen al guardar
--            el local a partir de la dirección (OpenStreetMap).

alter table public.venues
  add column if not exists city text not null default '' check (char_length(city) <= 80),
  add column if not exists lat double precision check (lat between -90 and 90),
  add column if not exists lng double precision check (lng between -180 and 180);

alter table public.venues drop constraint if exists venues_coords_pair;
alter table public.venues
  add constraint venues_coords_pair check ((lat is null) = (lng is null));

create index if not exists venues_city_idx on public.venues (lower(city));

grant insert (city, lat, lng) on public.venues to authenticated;
grant update (city, lat, lng) on public.venues to authenticated;
