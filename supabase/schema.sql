-- =====================================================================
-- EventGo · Esquema de base de datos para Supabase
-- Ejecutar una sola vez en: Dashboard > SQL Editor > New query > Run
-- =====================================================================
--
-- Seguridad en tres capas:
--   1. Privilegios por columna: los usuarios solo pueden escribir las
--      columnas permitidas (nunca user_id, type ni views).
--   2. Row Level Security: cada fila solo la modifica su dueño.
--   3. Restricciones CHECK: los datos siempre tienen un formato válido.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------

create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  type          text not null check (type in ('cliente', 'comerciante')),
  name          text not null default '' check (char_length(name) <= 100),
  business_name text not null default '' check (char_length(business_name) <= 100),
  created_at    timestamptz not null default now()
);

create table public.venues (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name        text not null check (char_length(btrim(name)) between 1 and 100),
  address     text not null check (char_length(btrim(address)) between 1 and 200),
  description text not null default '' check (char_length(description) <= 2000),
  website     text not null default '' check (website = '' or website ~* '^https?://\S+$'),
  instagram   text not null default '' check (instagram ~ '^[A-Za-z0-9._]{0,30}$'),
  city        text not null default '' check (char_length(city) <= 80),
  lat         double precision check (lat between -90 and 90),
  lng         double precision check (lng between -180 and 180),
  created_at  timestamptz not null default now(),
  constraint venues_coords_pair check ((lat is null) = (lng is null))
);
create index venues_user_id_idx on public.venues (user_id);
create index venues_city_idx on public.venues (lower(city));

create table public.events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  venue_id    uuid not null references public.venues (id) on delete restrict,
  title       text not null check (char_length(btrim(title)) between 1 and 120),
  description text not null default '' check (char_length(description) <= 5000),
  date        date not null,
  start_time  text not null default '' check (start_time = '' or start_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  end_time    text not null default '' check (end_time = '' or end_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  category    text check (category in ('Fiesta', 'Tardeo Fest', 'Música en Directo', 'Arte', 'Tarde', 'Noche')),
  cover_path  text check (char_length(cover_path) <= 300),
  views       integer not null default 0,
  created_at  timestamptz not null default now()
);
create index events_date_idx on public.events (date);
create index events_venue_id_idx on public.events (venue_id);
create index events_user_id_idx on public.events (user_id);

create table public.venue_follows (
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  venue_id   uuid not null references public.venues (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, venue_id)
);
create index venue_follows_venue_id_idx on public.venue_follows (venue_id);

-- ---------------------------------------------------------------------
-- Perfil automático al registrarse (datos enviados en signUp > options.data)
-- ---------------------------------------------------------------------

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  account_type text := new.raw_user_meta_data ->> 'type';
begin
  if account_type is null or account_type not in ('cliente', 'comerciante') then
    account_type := 'cliente';
  end if;

  insert into public.profiles (id, type, name, business_name)
  values (
    new.id,
    account_type,
    left(coalesce(new.raw_user_meta_data ->> 'name', ''), 100),
    case when account_type = 'comerciante'
      then left(coalesce(new.raw_user_meta_data ->> 'business_name', ''), 100)
      else '' end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.is_merchant()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and type = 'comerciante');
$$;

-- Suma una vista a un evento. Solo con sesión iniciada; es la única forma de cambiar `views`.
create function public.register_event_view(p_event_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_views integer;
begin
  if auth.uid() is null then
    raise exception 'Sesión requerida' using errcode = '42501';
  end if;
  update public.events set views = views + 1 where id = p_event_id returning views into new_views;
  if new_views is null then
    raise exception 'Evento no encontrado' using errcode = 'P0002';
  end if;
  return new_views;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.register_event_view(uuid) from public, anon;
grant execute on function public.register_event_view(uuid) to authenticated;

-- Totales de seguidores de los locales del comerciante (sin revelar quién sigue).
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

-- ---------------------------------------------------------------------
-- Privilegios por columna
-- ---------------------------------------------------------------------

revoke all on public.profiles, public.venues, public.events, public.venue_follows from anon, authenticated;

grant select on public.profiles to authenticated;
grant update (name, business_name) on public.profiles to authenticated;

grant select, delete on public.venues to authenticated;
grant insert (name, address, description, website, instagram, city, lat, lng) on public.venues to authenticated;
grant update (name, address, description, website, instagram, city, lat, lng) on public.venues to authenticated;

-- Invitados: solo título, fecha y portada (el resto requiere iniciar sesión).
grant select (id, title, date, cover_path) on public.events to anon;
grant select, delete on public.events to authenticated;
grant insert (venue_id, title, description, date, start_time, end_time, category, cover_path) on public.events to authenticated;
grant update (venue_id, title, description, date, start_time, end_time, category, cover_path) on public.events to authenticated;

grant select, delete on public.venue_follows to authenticated;
grant insert (venue_id) on public.venue_follows to authenticated;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------

alter table public.profiles      enable row level security;
alter table public.venues        enable row level security;
alter table public.events        enable row level security;
alter table public.venue_follows enable row level security;

create policy "Perfil: ver el propio" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "Perfil: editar el propio" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "Locales: visibles con sesión" on public.venues
  for select to authenticated using (true);
create policy "Locales: crear (comerciantes)" on public.venues
  for insert to authenticated with check (user_id = (select auth.uid()) and public.is_merchant());
create policy "Locales: editar los propios" on public.venues
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Locales: borrar los propios" on public.venues
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "Eventos: visibles para todos" on public.events
  for select to anon, authenticated using (true);
create policy "Eventos: crear en un local propio" on public.events
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and public.is_merchant()
    and exists (select 1 from public.venues v where v.id = venue_id and v.user_id = (select auth.uid()))
    and (cover_path is null or cover_path like (select auth.uid())::text || '/%')
  );
create policy "Eventos: editar los propios" on public.events
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.venues v where v.id = venue_id and v.user_id = (select auth.uid()))
    and (cover_path is null or cover_path like (select auth.uid())::text || '/%')
  );
create policy "Eventos: borrar los propios" on public.events
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "Seguimientos: ver los propios" on public.venue_follows
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Seguimientos: crear los propios" on public.venue_follows
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Seguimientos: borrar los propios" on public.venue_follows
  for delete to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- Almacenamiento de portadas: público para leer, cada comerciante en su carpeta
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('event-covers', 'event-covers', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "Portadas: ver las propias" on storage.objects
  for select to authenticated
  using (bucket_id = 'event-covers' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Portadas: subir en tu carpeta" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'event-covers' and (storage.foldername(name))[1] = (select auth.uid())::text and public.is_merchant());
create policy "Portadas: borrar las propias" on storage.objects
  for delete to authenticated
  using (bucket_id = 'event-covers' and (storage.foldername(name))[1] = (select auth.uid())::text);
