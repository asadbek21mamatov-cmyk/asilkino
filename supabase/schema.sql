-- AsilKino (Asilmedia uslubidagi onlayn kinoteatr) uchun Supabase Postgres sxemasi
-- Ushbu faylni yangi Supabase loyihangizning SQL Editor bo'limida ishga tushirishingiz mumkin.

create table if not exists public.movies (
  id bigint generated always as identity primary key,
  slug text not null unique,
  title text not null,
  original_title text not null default '',
  category text not null check (category in ('tarjima', 'serial', 'multfilm')),
  genres text[] not null default '{}',
  year integer not null check (year >= 1900 and year <= 2100),
  country text not null,
  duration text not null default '2 s 00 daq',
  quality text not null default '1080p Full HD',
  language_badge text not null default 'O''zbek tilida',
  age_rating text not null default '16+',
  imdb_rating numeric(3,1) not null default 7.5 check (imdb_rating >= 0 and imdb_rating <= 10),
  kp_rating numeric(3,1) not null default 7.4 check (kp_rating >= 0 and kp_rating <= 10),
  views integer not null default 0,
  likes integer not null default 0,
  dislikes integer not null default 0,
  is_premiere boolean not null default false,
  is_featured boolean not null default false,
  director text not null default '',
  cast_members text[] not null default '{}',
  translator text not null default 'AsilKino Professional Dublyaj',
  description text not null,
  poster_url text not null,
  backdrop_url text not null,
  video_url text not null,
  trailer_url text not null default '',
  file_size_1080p text not null default '2.1 GB',
  file_size_720p text not null default '1.1 GB',
  file_size_480p text not null default '560 MB',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.episodes (
  id bigint generated always as identity primary key,
  movie_id bigint not null references public.movies(id) on delete cascade,
  season_number integer not null default 1,
  episode_number integer not null,
  title text not null,
  duration text not null default '45 daq',
  video_url text not null,
  created_at timestamptz not null default now(),
  unique (movie_id, season_number, episode_number)
);

create table if not exists public.comments (
  id bigint generated always as identity primary key,
  movie_id bigint not null references public.movies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  author_name text not null check (char_length(author_name) between 2 and 60),
  body text not null check (char_length(body) between 2 and 1000),
  rating integer not null default 5 check (rating between 1 and 5),
  created_at timestamptz not null default now()
);

create table if not exists public.favorites (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  movie_id bigint not null references public.movies(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, movie_id)
);

-- Indekslar (Qidiruv, filtrlar va tashqi kalitlar tezligi uchun)
create index if not exists movies_category_idx on public.movies (category);
create index if not exists movies_year_idx on public.movies (year desc);
create index if not exists movies_country_idx on public.movies (country);
create index if not exists movies_is_premiere_idx on public.movies (is_premiere) where is_premiere = true;
create index if not exists movies_genres_gin_idx on public.movies using gin (genres);
create index if not exists episodes_movie_id_idx on public.episodes (movie_id);
create index if not exists comments_movie_id_idx on public.comments (movie_id, created_at desc);
create index if not exists favorites_user_id_idx on public.favorites (user_id);
create index if not exists favorites_movie_id_idx on public.favorites (movie_id);

-- Row Level Security (RLS) yoqish
alter table public.movies enable row level security;
alter table public.episodes enable row level security;
alter table public.comments enable row level security;
alter table public.favorites enable row level security;

-- Ochiq o'qish ruxsatlari (Barcha tashrif buyuruvchilar kinolar, qismlar va izohlarni ko'ra oladi)
create policy "movies_public_select" on public.movies
  for select to anon, authenticated
  using (true);

create policy "episodes_public_select" on public.episodes
  for select to anon, authenticated
  using (true);

create policy "comments_public_select" on public.comments
  for select to anon, authenticated
  using (true);

-- Admin huquqiga ega foydalanuvchilar uchun kinolar va qismlarni boshqarish (app_metadata orqali)
create policy "movies_admin_all" on public.movies
  for all to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy "episodes_admin_all" on public.episodes
  for all to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

-- Foydalanuvchilar izoh qoldirishi va o'z izohini o'chirishi
create policy "comments_insert_public" on public.comments
  for insert to anon, authenticated
  with check (
    (user_id is null) or ((select auth.uid()) = user_id)
  );

create policy "comments_delete_own" on public.comments
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Foydalanuvchilar o'z "Sevimlilar" ro'yxatini boshqarishi
create policy "favorites_select_own" on public.favorites
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "favorites_insert_own" on public.favorites
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "favorites_delete_own" on public.favorites
  for delete to authenticated
  using ((select auth.uid()) = user_id);
