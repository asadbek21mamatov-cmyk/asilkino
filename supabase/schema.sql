-- AsilKino (Netflix pleerli O'zbek tilidagi onlayn kinoteatr) uchun Supabase Postgres sxemasi
-- Ushbu faylni Supabase loyihangizning SQL Editor bo'limida ishga tushirishingiz mumkin.

create table if not exists public.movies (
  id bigint generated always as identity primary key,
  slug text not null unique,
  title text not null,
  original_title text not null default '',
  category text not null check (category in ('tarjima', 'serial', 'multfilm')),
  studio text not null default 'Marvel Studios',
  genres text[] not null default '{}',
  year integer not null check (year >= 1900 and year <= 2100),
  country text not null,
  duration text not null default '2 s 00 daq',
  quality text not null default '4K Ultra HD',
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

alter table public.movies add column if not exists studio text not null default 'Marvel Studios';

create table if not exists public.episodes (
  id bigint generated always as identity primary key,
  movie_id bigint not null references public.movies(id) on delete cascade,
  season_number integer not null default 1,
  episode_number integer not null,
  title text not null,
  duration text not null default '50 daq',
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

-- Indekslar
create index if not exists movies_category_idx on public.movies (category);
create index if not exists movies_studio_idx on public.movies (studio);
create index if not exists movies_year_idx on public.movies (year desc);
create index if not exists movies_country_idx on public.movies (country);
create index if not exists movies_is_premiere_idx on public.movies (is_premiere) where is_premiere = true;
create index if not exists movies_genres_gin_idx on public.movies using gin (genres);
create index if not exists episodes_movie_id_idx on public.episodes (movie_id);
create index if not exists comments_movie_id_idx on public.comments (movie_id, created_at desc);
create index if not exists favorites_user_id_idx on public.favorites (user_id);
create index if not exists favorites_movie_id_idx on public.favorites (movie_id);

-- Row Level Security (RLS)
alter table public.movies enable row level security;
alter table public.episodes enable row level security;
alter table public.comments enable row level security;
alter table public.favorites enable row level security;

drop policy if exists "movies_public_select" on public.movies;
create policy "movies_public_select" on public.movies
  for select to anon, authenticated using (true);

drop policy if exists "episodes_public_select" on public.episodes;
create policy "episodes_public_select" on public.episodes
  for select to anon, authenticated using (true);

drop policy if exists "comments_public_select" on public.comments;
create policy "comments_public_select" on public.comments
  for select to anon, authenticated using (true);

drop policy if exists "movies_admin_all" on public.movies;
create policy "movies_admin_all" on public.movies
  for all to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "episodes_admin_all" on public.episodes;
create policy "episodes_admin_all" on public.episodes
  for all to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

-- Storage bucket (kino MP4 fayllari va posterlar uchun)
insert into storage.buckets (id, name, public)
values ('movies-media', 'movies-media', true)
on conflict (id) do update set public = true;

drop policy if exists "movies_media_public_read" on storage.objects;
create policy "movies_media_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'movies-media');

drop policy if exists "movies_media_admin_write" on storage.objects;
create policy "movies_media_admin_write" on storage.objects
  for all to authenticated
  using (bucket_id = 'movies-media' and ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  with check (bucket_id = 'movies-media' and ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

-- 36 ta haqiqiy blokbaster kinolar, seriallar va multfilmlar bazasi

-- Eski xato slugni to'g'irlash
UPDATE public.movies SET slug = 'loki-serial' WHERE slug = 'lokiy-serial' AND NOT EXISTS (SELECT 1 FROM public.movies WHERE slug = 'loki-serial');

INSERT INTO public.movies (
  slug, title, original_title, category, studio, genres, year, country, duration,
  quality, age_rating, imdb_rating, kp_rating, views, is_premiere, is_featured,
  director, cast_members, description, poster_url, backdrop_url, video_url, trailer_url, created_at, updated_at
) VALUES (
  'qasoskorlar-intiho', 'Qasoskorlar: Intiho', 'Avengers: Endgame', 'tarjima', 'Marvel Studios',
  ARRAY['Jangari', 'Fantastika', 'Sarguzasht'], 2019, 'AQSH', '3 s 01 daq',
  '4K Ultra HD', '16+', 8.4, 7.9, 689300,
  false, true, 'Entoni va Jo Russo', ARRAY['Robert Dauni kich.', 'Kris Evans', 'Kris Xemsvort', 'Skarlett Yoxansson', 'Mark Ruffalo'],
  'Tanos Cheksizlik toshlari yordamida koinotdagi barcha tirik mavjudotlarning yarmini yo''q qilgach, tirik qolgan Qasoskorlar so''nggi imkoniyatni ishga solib, vaqt orqali o''tmishga qaytishadi va insoniyat taqdiri uchun eng buyuk jangga kirishadilar.', 'https://m.media-amazon.com/images/M/MV5BMTc5MDE2ODcwNV5BMl5BanBnXkFtZTgwMzI2NzQ2NzM@._V1_FMjpg_UX800_.jpg', 'https://i.ytimg.com/vi/TcMBFSGVi1c/maxresdefault.jpg', 'https://www.youtube.com/watch?v=TcMBFSGVi1c', 'https://www.youtube.com/watch?v=TcMBFSGVi1c',
  '2026-11-05T20:36:00Z', now()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  original_title = EXCLUDED.original_title,
  category = EXCLUDED.category,
  studio = EXCLUDED.studio,
  genres = EXCLUDED.genres,
  year = EXCLUDED.year,
  country = EXCLUDED.country,
  duration = EXCLUDED.duration,
  quality = EXCLUDED.quality,
  age_rating = EXCLUDED.age_rating,
  imdb_rating = EXCLUDED.imdb_rating,
  kp_rating = EXCLUDED.kp_rating,
  views = EXCLUDED.views,
  is_premiere = EXCLUDED.is_premiere,
  is_featured = EXCLUDED.is_featured,
  director = EXCLUDED.director,
  cast_members = EXCLUDED.cast_members,
  description = EXCLUDED.description,
  poster_url = EXCLUDED.poster_url,
  backdrop_url = EXCLUDED.backdrop_url,
  video_url = EXCLUDED.video_url,
  trailer_url = EXCLUDED.trailer_url,
  created_at = EXCLUDED.created_at,
  updated_at = now();

INSERT INTO public.movies (
  slug, title, original_title, category, studio, genres, year, country, duration,
  quality, age_rating, imdb_rating, kp_rating, views, is_premiere, is_featured,
  director, cast_members, description, poster_url, backdrop_url, video_url, trailer_url, created_at, updated_at
) VALUES (
  'qasoskorlar-cheksizlik-jangi', 'Qasoskorlar: Cheksizlik jangi', 'Avengers: Infinity War', 'tarjima', 'Marvel Studios',
  ARRAY['Jangari', 'Fantastika', 'Sarguzasht'], 2018, 'AQSH', '2 s 29 daq',
  '4K Ultra HD', '16+', 8.4, 8.1, 594100,
  false, false, 'Entoni va Jo Russo', ARRAY['Robert Dauni kich.', 'Josh Brolin', 'Kris Xemsvort', 'Benedikt Kamberbetch', 'Tom Xolland'],
  'Qasoskorlar va Galaktika qo''riqchilari qudratli titan Tanos barcha oltita Cheksizlik toshini qo''lga kiritib, butun borliqni mahv etishidan oldin uni to''xtatish uchun barcha kuchlarini birlashtiradilar.', 'https://m.media-amazon.com/images/M/MV5BMjMxNjY2MDU1OV5BMl5BanBnXkFtZTgwNzY1MTUwNTM@._V1_FMjpg_UX800_.jpg', 'https://i.ytimg.com/vi/6ZfuNTqbHE8/maxresdefault.jpg', 'https://www.youtube.com/watch?v=6ZfuNTqbHE8', 'https://www.youtube.com/watch?v=6ZfuNTqbHE8',
  '2026-11-05T20:35:00Z', now()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  original_title = EXCLUDED.original_title,
  category = EXCLUDED.category,
  studio = EXCLUDED.studio,
  genres = EXCLUDED.genres,
  year = EXCLUDED.year,
  country = EXCLUDED.country,
  duration = EXCLUDED.duration,
  quality = EXCLUDED.quality,
  age_rating = EXCLUDED.age_rating,
  imdb_rating = EXCLUDED.imdb_rating,
  kp_rating = EXCLUDED.kp_rating,
  views = EXCLUDED.views,
  is_premiere = EXCLUDED.is_premiere,
  is_featured = EXCLUDED.is_featured,
  director = EXCLUDED.director,
  cast_members = EXCLUDED.cast_members,
  description = EXCLUDED.description,
  poster_url = EXCLUDED.poster_url,
  backdrop_url = EXCLUDED.backdrop_url,
  video_url = EXCLUDED.video_url,
  trailer_url = EXCLUDED.trailer_url,
  created_at = EXCLUDED.created_at,
  updated_at = now();

INSERT INTO public.movies (
  slug, title, original_title, category, studio, genres, year, country, duration,
  quality, age_rating, imdb_rating, kp_rating, views, is_premiere, is_featured,
  director, cast_members, description, poster_url, backdrop_url, video_url, trailer_url, created_at, updated_at
) VALUES (
  'orgimchak-odam-uyga-yol-yoq', 'O''rgimchak odam: Uyga yo''l yo''q', 'Spider-Man: No Way Home', 'tarjima', 'Marvel Studios',
  ARRAY['Jangari', 'Sarguzasht', 'Fantastika'], 2021, 'AQSH', '2 s 28 daq',
  '4K Ultra HD', '12+', 8.2, 7.9, 542800,
  false, true, 'Jon Uotts', ARRAY['Tom Xolland', 'Zendaya', 'Benedikt Kamberbetch', 'Tobi Maguayr', 'Endryu Garfild'],
  'Piter Parkerning O''rgimchak odam ekanligi butun dunyoga fosh bo''lgach, u Doktor Strenjdan yordam so''raydi. Biroq jodu izdan chiqib, multikoinot darvozalari ochiladi va boshqa olamlardagi eng xavfli yovuzlar kirib keladi.', 'https://m.media-amazon.com/images/M/MV5BMmFiZGZjMmEtMTA0Ni00MzA2LTljMTYtZGI2MGJmZWYzZTQ2XkEyXkFqcGc@._V1_FMjpg_UX800_.jpg', 'https://i.ytimg.com/vi/JfVOs4VSpmA/maxresdefault.jpg', 'https://www.youtube.com/watch?v=JfVOs4VSpmA', 'https://www.youtube.com/watch?v=JfVOs4VSpmA',
  '2026-11-05T20:34:00Z', now()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  original_title = EXCLUDED.original_title,
  category = EXCLUDED.category,
  studio = EXCLUDED.studio,
  genres = EXCLUDED.genres,
  year = EXCLUDED.year,
  country = EXCLUDED.country,
  duration = EXCLUDED.duration,
  quality = EXCLUDED.quality,
  age_rating = EXCLUDED.age_rating,
  imdb_rating = EXCLUDED.imdb_rating,
  kp_rating = EXCLUDED.kp_rating,
  views = EXCLUDED.views,
  is_premiere = EXCLUDED.is_premiere,
  is_featured = EXCLUDED.is_featured,
  director = EXCLUDED.director,
  cast_members = EXCLUDED.cast_members,
  description = EXCLUDED.description,
  poster_url = EXCLUDED.poster_url,
  backdrop_url = EXCLUDED.backdrop_url,
  video_url = EXCLUDED.video_url,
  trailer_url = EXCLUDED.trailer_url,
  created_at = EXCLUDED.created_at,
  updated_at = now();

INSERT INTO public.movies (
  slug, title, original_title, category, studio, genres, year, country, duration,
  quality, age_rating, imdb_rating, kp_rating, views, is_premiere, is_featured,
  director, cast_members, description, poster_url, backdrop_url, video_url, trailer_url, created_at, updated_at
) VALUES (
  'temir-odam', 'Temir Odam', 'Iron Man', 'tarjima', 'Marvel Studios',
  ARRAY['Jangari', 'Fantastika', 'Sarguzasht'], 2008, 'AQSH', '2 s 06 daq',
  '1080p Full HD', '12+', 7.9, 8, 498000,
  false, false, 'Jon Favro', ARRAY['Robert Dauni kich.', 'Gvinet Peltrou', 'Jeff Brijes', 'Terrens Xovard'],
  'Daho ixtirochi va milliarder Toni Stark terrorchilar asirligidan qutulish uchun yuqori texnologiyali zirhli kostyum yaratadi. Vataniga qaytgach, u dunyoni yovuz kuchlardan asrovchi Temir Odamga aylanadi.', 'https://m.media-amazon.com/images/M/MV5BMTczNTI2ODUwOF5BMl5BanBnXkFtZTcwMTU0NTIzMw@@._V1_FMjpg_UX800_.jpg', 'https://i.ytimg.com/vi/8ugaeA-nMTc/maxresdefault.jpg', 'https://www.youtube.com/watch?v=8ugaeA-nMTc', 'https://www.youtube.com/watch?v=8ugaeA-nMTc',
  '2026-11-05T20:33:00Z', now()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  original_title = EXCLUDED.original_title,
  category = EXCLUDED.category,
  studio = EXCLUDED.studio,
  genres = EXCLUDED.genres,
  year = EXCLUDED.year,
  country = EXCLUDED.country,
  duration = EXCLUDED.duration,
  quality = EXCLUDED.quality,
  age_rating = EXCLUDED.age_rating,
  imdb_rating = EXCLUDED.imdb_rating,
  kp_rating = EXCLUDED.kp_rating,
  views = EXCLUDED.views,
  is_premiere = EXCLUDED.is_premiere,
  is_featured = EXCLUDED.is_featured,
  director = EXCLUDED.director,
  cast_members = EXCLUDED.cast_members,
  description = EXCLUDED.description,
  poster_url = EXCLUDED.poster_url,
  backdrop_url = EXCLUDED.backdrop_url,
  video_url = EXCLUDED.video_url,
  trailer_url = EXCLUDED.trailer_url,
  created_at = EXCLUDED.created_at,
  updated_at = now();

INSERT INTO public.movies (
  slug, title, original_title, category, studio, genres, year, country, duration,
  quality, age_rating, imdb_rating, kp_rating, views, is_premiere, is_featured,
  director, cast_members, description, poster_url, backdrop_url, video_url, trailer_url, created_at, updated_at
) VALUES (
  'qora-pantera', 'Qora Pantera', 'Black Panther', 'tarjima', 'Marvel Studios',
  ARRAY['Jangari', 'Sarguzasht', 'Fantastika'], 2018, 'AQSH', '2 s 14 daq',
  '4K Ultra HD', '16+', 7.3, 6.6, 368400,
  false, false, 'Rayan Kugler', ARRAY['Chedvik Bouzman', 'Maykl B. Jordan', 'Lupita Niongo', 'Danay Gurira'],
  'Otasining vafotidan so''ng shahzoda T''Challa texnologik jihatdan yuksak rivojlangan yashirin Afrika davlati — Vakanda taxtini egallash uchun qaytadi. Ammo qadimiy dushman paydo bo''lgach, Vakanda va butun dunyo xavf ostida qoladi.', 'https://m.media-amazon.com/images/M/MV5BMTg1MTY2MjYzNV5BMl5BanBnXkFtZTgwMTc4NTMwNDI@._V1_FMjpg_UX800_.jpg', 'https://i.ytimg.com/vi/xjDjIWPwcPU/maxresdefault.jpg', 'https://www.youtube.com/watch?v=xjDjIWPwcPU', 'https://www.youtube.com/watch?v=xjDjIWPwcPU',
  '2026-11-05T20:32:00Z', now()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  original_title = EXCLUDED.original_title,
  category = EXCLUDED.category,
  studio = EXCLUDED.studio,
  genres = EXCLUDED.genres,
  year = EXCLUDED.year,
  country = EXCLUDED.country,
  duration = EXCLUDED.duration,
  quality = EXCLUDED.quality,
  age_rating = EXCLUDED.age_rating,
  imdb_rating = EXCLUDED.imdb_rating,
  kp_rating = EXCLUDED.kp_rating,
  views = EXCLUDED.views,
  is_premiere = EXCLUDED.is_premiere,
  is_featured = EXCLUDED.is_featured,
  director = EXCLUDED.director,
  cast_members = EXCLUDED.cast_members,
  description = EXCLUDED.description,
  poster_url = EXCLUDED.poster_url,
  backdrop_url = EXCLUDED.backdrop_url,
  video_url = EXCLUDED.video_url,
  trailer_url = EXCLUDED.trailer_url,
  created_at = EXCLUDED.created_at,
  updated_at = now();

INSERT INTO public.movies (
  slug, title, original_title, category, studio, genres, year, country, duration,
  quality, age_rating, imdb_rating, kp_rating, views, is_premiere, is_featured,
  director, cast_members, description, poster_url, backdrop_url, video_url, trailer_url, created_at, updated_at
) VALUES (
  'doktor-strenj-2', 'Doktor Strenj: Telbalik multikoinotida', 'Doctor Strange in the Multiverse of Madness', 'tarjima', 'Marvel Studios',
  ARRAY['Fantastika', 'Fentezi', 'Jangari'], 2022, 'AQSH', '2 s 06 daq',
  '4K Ultra HD', '16+', 6.9, 6.6, 342000,
  false, false, 'Sem Reymi', ARRAY['Benedikt Kamberbetch', 'Elizabet Olsen', 'Chivetel Ejiofor', 'Benedikt Vong'],
  'Doktor Stiven Strenj taqiqlangan afsun yordamida multikoinotning sirli va xavfli muqobil olamlariga yo''l ochadi. Yangi tahdidni to''xtatish uchun u ittifoqchilari bilan noma''lum realliklararo sayohatga otlanadi.', 'https://m.media-amazon.com/images/M/MV5BN2YxZGRjMzYtZjE1ZC00MDI0LThjZmQtZTZmMzVmMmQ2NzBmXkEyXkFqcGc@._V1_FMjpg_UX800_.jpg', 'https://i.ytimg.com/vi/aWzlQ2N6qqg/maxresdefault.jpg', 'https://www.youtube.com/watch?v=aWzlQ2N6qqg', 'https://www.youtube.com/watch?v=aWzlQ2N6qqg',
  '2026-11-05T20:31:00Z', now()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  original_title = EXCLUDED.original_title,
  category = EXCLUDED.category,
  studio = EXCLUDED.studio,
  genres = EXCLUDED.genres,
  year = EXCLUDED.year,
  country = EXCLUDED.country,
  duration = EXCLUDED.duration,
  quality = EXCLUDED.quality,
  age_rating = EXCLUDED.age_rating,
  imdb_rating = EXCLUDED.imdb_rating,
  kp_rating = EXCLUDED.kp_rating,
  views = EXCLUDED.views,
  is_premiere = EXCLUDED.is_premiere,
  is_featured = EXCLUDED.is_featured,
  director = EXCLUDED.director,
  cast_members = EXCLUDED.cast_members,
  description = EXCLUDED.description,
  poster_url = EXCLUDED.poster_url,
  backdrop_url = EXCLUDED.backdrop_url,
  video_url = EXCLUDED.video_url,
  trailer_url = EXCLUDED.trailer_url,
  created_at = EXCLUDED.created_at,
  updated_at = now();

INSERT INTO public.movies (
  slug, title, original_title, category, studio, genres, year, country, duration,
  quality, age_rating, imdb_rating, kp_rating, views, is_premiere, is_featured,
  director, cast_members, description, poster_url, backdrop_url, video_url, trailer_url, created_at, updated_at
) VALUES (
  'galaktika-qoriqchilari-3', 'Galaktika qo''riqchilari 3', 'Guardians of the Galaxy Vol. 3', 'tarjima', 'Marvel Studios',
  ARRAY['Fantastika', 'Sarguzasht', 'Komediya', 'Jangari'], 2023, 'AQSH', '2 s 30 daq',
  '4K Ultra HD', '16+', 7.9, 8.2, 418900,
  true, false, 'Jeyms Gann', ARRAY['Kris Pratt', 'Zoi Saldana', 'Deyv Batista', 'Bredli Kuper', 'Karen Gillan'],
  'Piter Kvill va uning sodiq jamoasi do''stlari Raketaning hayotini saqlab qolish uchun xavfli missiyaga otlanishadi. Muvaffaqiyatsizlik Galaktika qo''riqchilarining yakuniga sabab bo''lishi mumkin.', 'https://m.media-amazon.com/images/M/MV5BOTJhOTMxMmItZmE0Ny00MDc3LWEzOGEtOGFkMzY4MWYyZDQ0XkEyXkFqcGc@._V1_FMjpg_UX800_.jpg', 'https://i.ytimg.com/vi/u3V5KDHRQvk/maxresdefault.jpg', 'https://www.youtube.com/watch?v=u3V5KDHRQvk', 'https://www.youtube.com/watch?v=u3V5KDHRQvk',
  '2026-11-05T20:30:00Z', now()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  original_title = EXCLUDED.original_title,
  category = EXCLUDED.category,
  studio = EXCLUDED.studio,
  genres = EXCLUDED.genres,
  year = EXCLUDED.year,
  country = EXCLUDED.country,
  duration = EXCLUDED.duration,
  quality = EXCLUDED.quality,
  age_rating = EXCLUDED.age_rating,
  imdb_rating = EXCLUDED.imdb_rating,
  kp_rating = EXCLUDED.kp_rating,
  views = EXCLUDED.views,
  is_premiere = EXCLUDED.is_premiere,
  is_featured = EXCLUDED.is_featured,
  director = EXCLUDED.director,
  cast_members = EXCLUDED.cast_members,
  description = EXCLUDED.description,
  poster_url = EXCLUDED.poster_url,
  backdrop_url = EXCLUDED.backdrop_url,
  video_url = EXCLUDED.video_url,
  trailer_url = EXCLUDED.trailer_url,
  created_at = EXCLUDED.created_at,
  updated_at = now();

INSERT INTO public.movies (
  slug, title, original_title, category, studio, genres, year, country, duration,
  quality, age_rating, imdb_rating, kp_rating, views, is_premiere, is_featured,
  director, cast_members, description, poster_url, backdrop_url, video_url, trailer_url, created_at, updated_at
) VALUES (
  'loki-serial', 'Loki', 'Loki', 'serial', 'Marvel Studios',
  ARRAY['Fantastika', 'Sarguzasht', 'Fentezi'], 2023, 'AQSH', '50 daq / qism',
  '4K Ultra HD', '16+', 8.2, 7.8, 376500,
  true, false, 'Keyt Xerron, Jastin Benson', ARRAY['Tom Xiddlston', 'Ouen Uilson', 'Sofiya Di Martino', 'Ke Xuy Kuan'],
  'Tesseraktni o''g''irlab qochgan makkorlik xudosi Loki ''Vaqt o''zgarishlarini nazorat qilish boshqarmasi'' (TVA) qo''liga tushadi. Endi u muqaddas vaqt chizig''ini halokatdan qutqarishga majbur.', 'https://m.media-amazon.com/images/M/MV5BYzA2YjM2ZWQtYTZhMS00OTI3LTlhYzQtZjBiZWZkMDdlNjA5XkEyXkFqcGc@._V1_FMjpg_UX800_.jpg', 'https://i.ytimg.com/vi/nW948Va-l10/maxresdefault.jpg', 'https://www.youtube.com/watch?v=nW948Va-l10', 'https://www.youtube.com/watch?v=nW948Va-l10',
  '2026-11-05T20:29:00Z', now()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  original_title = EXCLUDED.original_title,
  category = EXCLUDED.category,
  studio = EXCLUDED.studio,
  genres = EXCLUDED.genres,
  year = EXCLUDED.year,
  country = EXCLUDED.country,
  duration = EXCLUDED.duration,
  quality = EXCLUDED.quality,
  age_rating = EXCLUDED.age_rating,
  imdb_rating = EXCLUDED.imdb_rating,
  kp_rating = EXCLUDED.kp_rating,
  views = EXCLUDED.views,
  is_premiere = EXCLUDED.is_premiere,
  is_featured = EXCLUDED.is_featured,
  director = EXCLUDED.director,
  cast_members = EXCLUDED.cast_members,
  description = EXCLUDED.description,
  poster_url = EXCLUDED.poster_url,
  backdrop_url = EXCLUDED.backdrop_url,
  video_url = EXCLUDED.video_url,
  trailer_url = EXCLUDED.trailer_url,
  created_at = EXCLUDED.created_at,
  updated_at = now();

INSERT INTO public.episodes (movie_id, season_number, episode_number, title, duration, video_url)
SELECT id, 1, 1, 'Ulug''vor maqsad', '51 daq', 'https://www.youtube.com/watch?v=nW948Va-l10'
FROM public.movies WHERE slug = 'loki-serial'
ON CONFLICT (movie_id, season_number, episode_number) DO UPDATE SET
  title = EXCLUDED.title,
  duration = EXCLUDED.duration,
  video_url = EXCLUDED.video_url;

INSERT INTO public.episodes (movie_id, season_number, episode_number, title, duration, video_url)
SELECT id, 1, 2, 'Variant', '54 daq', 'https://www.youtube.com/watch?v=nW948Va-l10'
FROM public.movies WHERE slug = 'loki-serial'
ON CONFLICT (movie_id, season_number, episode_number) DO UPDATE SET
  title = EXCLUDED.title,
  duration = EXCLUDED.duration,
  video_url = EXCLUDED.video_url;

INSERT INTO public.episodes (movie_id, season_number, episode_number, title, duration, video_url)
SELECT id, 1, 3, 'Lamentis-1', '48 daq', 'https://www.youtube.com/watch?v=dug56u8NN7g'
FROM public.movies WHERE slug = 'loki-serial'
ON CONFLICT (movie_id, season_number, episode_number) DO UPDATE SET
  title = EXCLUDED.title,
  duration = EXCLUDED.duration,
  video_url = EXCLUDED.video_url;

INSERT INTO public.episodes (movie_id, season_number, episode_number, title, duration, video_url)
SELECT id, 1, 4, 'Vaqt qo''riqchilari', '52 daq', 'https://www.youtube.com/watch?v=G4JuopziR3Q'
FROM public.movies WHERE slug = 'loki-serial'
ON CONFLICT (movie_id, season_number, episode_number) DO UPDATE SET
  title = EXCLUDED.title,
  duration = EXCLUDED.duration,
  video_url = EXCLUDED.video_url;

INSERT INTO public.movies (
  slug, title, original_title, category, studio, genres, year, country, duration,
  quality, age_rating, imdb_rating, kp_rating, views, is_premiere, is_featured,
  director, cast_members, description, poster_url, backdrop_url, video_url, trailer_url, created_at, updated_at
) VALUES (
  'qora-ritsar', 'Qora Ritsar', 'The Dark Knight', 'tarjima', 'DC Studios',
  ARRAY['Jangari', 'Kriminal', 'Drama', 'Triller'], 2008, 'AQSH', '2 s 32 daq',
  '4K Ultra HD', '16+', 9, 8.5, 715200,
  false, true, 'Kristofer Nolan', ARRAY['Kristian Beyl', 'Xit Ledjer', 'Aaron Ekxart', 'Maykl Keyn', 'Geri Oldman'],
  'Betmen leytenant Jim Gordon va prokuror Xarvi Dent bilan birgalikda Gotem ko''chalarini jinoyat olamidan tozalashga kirishadi. Ammo ularning yo''lida shaharni xaosga cho''mdiruvchi dahshatli daho — Joker paydo bo''ladi.', 'https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_FMjpg_UX800_.jpg', 'https://i.ytimg.com/vi/EXeTwQWrcwY/maxresdefault.jpg', 'https://www.youtube.com/watch?v=EXeTwQWrcwY', 'https://www.youtube.com/watch?v=EXeTwQWrcwY',
  '2026-11-05T20:28:00Z', now()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  original_title = EXCLUDED.original_title,
  category = EXCLUDED.category,
  studio = EXCLUDED.studio,
  genres = EXCLUDED.genres,
  year = EXCLUDED.year,
  country = EXCLUDED.country,
  duration = EXCLUDED.duration,
  quality = EXCLUDED.quality,
  age_rating = EXCLUDED.age_rating,
  imdb_rating = EXCLUDED.imdb_rating,
  kp_rating = EXCLUDED.kp_rating,
  views = EXCLUDED.views,
  is_premiere = EXCLUDED.is_premiere,
  is_featured = EXCLUDED.is_featured,
  director = EXCLUDED.director,
  cast_members = EXCLUDED.cast_members,
  description = EXCLUDED.description,
  poster_url = EXCLUDED.poster_url,
  backdrop_url = EXCLUDED.backdrop_url,
  video_url = EXCLUDED.video_url,
  trailer_url = EXCLUDED.trailer_url,
  created_at = EXCLUDED.created_at,
  updated_at = now();

INSERT INTO public.movies (
  slug, title, original_title, category, studio, genres, year, country, duration,
  quality, age_rating, imdb_rating, kp_rating, views, is_premiere, is_featured,
  director, cast_members, description, poster_url, backdrop_url, video_url, trailer_url, created_at, updated_at
) VALUES (
  'betmen-2022', 'Betmen', 'The Batman', 'tarjima', 'DC Studios',
  ARRAY['Detektiv', 'Kriminal', 'Drama', 'Jangari'], 2022, 'AQSH', '2 s 56 daq',
  '4K Ultra HD', '16+', 7.8, 7.9, 429000,
  false, false, 'Mett Rivz', ARRAY['Robert Pattinson', 'Zoi Kravits', 'Pol Dano', 'Kolin Farrell', 'Jeffri Rayt'],
  'Ikki yildan beri Gotem jinoyatchilariga dahshat solib kelayotgan Bryus Ueyn shahar amaldorlarini nishonga olgan sirli qotil — Jumboqchi (Riddler) iziga tushadi va Ueynlar oilasiga aloqador qora sirlarni fosh etadi.', 'https://m.media-amazon.com/images/M/MV5BMmU5NGJlMzAtMGNmOC00YjJjLTgyMzUtNjAyYmE4Njg5YWMyXkEyXkFqcGc@._V1_FMjpg_UX800_.jpg', 'https://i.ytimg.com/vi/mqqft2x_Aa4/maxresdefault.jpg', 'https://www.youtube.com/watch?v=mqqft2x_Aa4', 'https://www.youtube.com/watch?v=mqqft2x_Aa4',
  '2026-11-05T20:27:00Z', now()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  original_title = EXCLUDED.original_title,
  category = EXCLUDED.category,
  studio = EXCLUDED.studio,
  genres = EXCLUDED.genres,
  year = EXCLUDED.year,
  country = EXCLUDED.country,
  duration = EXCLUDED.duration,
  quality = EXCLUDED.quality,
  age_rating = EXCLUDED.age_rating,
  imdb_rating = EXCLUDED.imdb_rating,
  kp_rating = EXCLUDED.kp_rating,
  views = EXCLUDED.views,
  is_premiere = EXCLUDED.is_premiere,
  is_featured = EXCLUDED.is_featured,
  director = EXCLUDED.director,
  cast_members = EXCLUDED.cast_members,
  description = EXCLUDED.description,
  poster_url = EXCLUDED.poster_url,
  backdrop_url = EXCLUDED.backdrop_url,
  video_url = EXCLUDED.video_url,
  trailer_url = EXCLUDED.trailer_url,
  created_at = EXCLUDED.created_at,
  updated_at = now();

INSERT INTO public.movies (
  slug, title, original_title, category, studio, genres, year, country, duration,
  quality, age_rating, imdb_rating, kp_rating, views, is_premiere, is_featured,
  director, cast_members, description, poster_url, backdrop_url, video_url, trailer_url, created_at, updated_at
) VALUES (
  'joker', 'Joker', 'Joker', 'tarjima', 'DC Studios',
  ARRAY['Drama', 'Kriminal', 'Triller'], 2019, 'AQSH', '2 s 02 daq',
  '4K Ultra HD', '18+', 8.4, 8, 538400,
  false, false, 'Todd Fillips', ARRAY['Xoakin Feniks', 'Robert De Niro', 'Zazi Bits', 'Frensis Konroy'],
  'Gotem shahrida jamiyat tomonidan rad etilgan va kamsitilgan komik Artur Flek asta-sekin aqldan ozib, shafqatsiz jinoyat olamining ramzi — Jokerga aylanadi.', 'https://m.media-amazon.com/images/M/MV5BNzY3OWQ5NDktNWQ2OC00ZjdlLThkMmItMDhhNDk3NTFiZGU4XkEyXkFqcGc@._V1_FMjpg_UX800_.jpg', 'https://i.ytimg.com/vi/zAGVQLHvwOY/maxresdefault.jpg', 'https://www.youtube.com/watch?v=zAGVQLHvwOY', 'https://www.youtube.com/watch?v=zAGVQLHvwOY',
  '2026-11-05T20:26:00Z', now()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  original_title = EXCLUDED.original_title,
  category = EXCLUDED.category,
  studio = EXCLUDED.studio,
  genres = EXCLUDED.genres,
  year = EXCLUDED.year,
  country = EXCLUDED.country,
  duration = EXCLUDED.duration,
  quality = EXCLUDED.quality,
  age_rating = EXCLUDED.age_rating,
  imdb_rating = EXCLUDED.imdb_rating,
  kp_rating = EXCLUDED.kp_rating,
  views = EXCLUDED.views,
  is_premiere = EXCLUDED.is_premiere,
  is_featured = EXCLUDED.is_featured,
  director = EXCLUDED.director,
  cast_members = EXCLUDED.cast_members,
  description = EXCLUDED.description,
  poster_url = EXCLUDED.poster_url,
  backdrop_url = EXCLUDED.backdrop_url,
  video_url = EXCLUDED.video_url,
  trailer_url = EXCLUDED.trailer_url,
  created_at = EXCLUDED.created_at,
  updated_at = now();

INSERT INTO public.movies (
  slug, title, original_title, category, studio, genres, year, country, duration,
  quality, age_rating, imdb_rating, kp_rating, views, is_premiere, is_featured,
  director, cast_members, description, poster_url, backdrop_url, video_url, trailer_url, created_at, updated_at
) VALUES (
  'adolat-ligasi', 'Adolat Ligasi', 'Justice League', 'tarjima', 'DC Studios',
  ARRAY['Jangari', 'Fantastika', 'Sarguzasht'], 2021, 'AQSH', '2 s 40 daq',
  '1080p Full HD', '16+', 7.9, 7.8, 389100,
  false, false, 'Zak Snayder', ARRAY['Ben Afflek', 'Genri Kavill', 'Gal Gadot', 'Jeyson Momoa', 'Ezra Miller'],
  'Supermenning fidokorligidan ilhomlangan Bryus Ueyn yangi ittifoqchisi Diana Prins bilan birgalikda Yerga yaqinlashib kelayotgan halokatli kosmik tahdidga qarshi meta-insonlar jamoasini to''playdi.', 'https://m.media-amazon.com/images/M/MV5BMjM5YmQxM2YtZjI2Yy00YjhhLTg5N2MtMTEyMzdlZDU3OTVhXkEyXkFqcGc@._V1_FMjpg_UX800_.jpg', 'https://i.ytimg.com/vi/3cxixDgHUYw/sddefault.jpg', 'https://www.youtube.com/watch?v=3cxixDgHUYw', 'https://www.youtube.com/watch?v=3cxixDgHUYw',
  '2026-11-05T20:25:00Z', now()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  original_title = EXCLUDED.original_title,
  category = EXCLUDED.category,
  studio = EXCLUDED.studio,
  genres = EXCLUDED.genres,
  year = EXCLUDED.year,
  country = EXCLUDED.country,
  duration = EXCLUDED.duration,
  quality = EXCLUDED.quality,
  age_rating = EXCLUDED.age_rating,
  imdb_rating = EXCLUDED.imdb_rating,
  kp_rating = EXCLUDED.kp_rating,
  views = EXCLUDED.views,
  is_premiere = EXCLUDED.is_premiere,
  is_featured = EXCLUDED.is_featured,
  director = EXCLUDED.director,
  cast_members = EXCLUDED.cast_members,
  description = EXCLUDED.description,
  poster_url = EXCLUDED.poster_url,
  backdrop_url = EXCLUDED.backdrop_url,
  video_url = EXCLUDED.video_url,
  trailer_url = EXCLUDED.trailer_url,
  created_at = EXCLUDED.created_at,
  updated_at = now();

INSERT INTO public.movies (
  slug, title, original_title, category, studio, genres, year, country, duration,
  quality, age_rating, imdb_rating, kp_rating, views, is_premiere, is_featured,
  director, cast_members, description, poster_url, backdrop_url, video_url, trailer_url, created_at, updated_at
) VALUES (
  'akvamen', 'Akvamen', 'Aquaman', 'tarjima', 'DC Studios',
  ARRAY['Jangari', 'Sarguzasht', 'Fentezi'], 2018, 'AQSH', '2 s 23 daq',
  '4K Ultra HD', '12+', 6.8, 6.8, 356000,
  false, false, 'Jeyms Van', ARRAY['Jeyson Momoa', 'Ember Xyord', 'Uillem Defo', 'Patrik Uilson', 'Nikol Kidman'],
  'Suv osti qirolligi Atlantidaning qonuniy merosxo''ri Artur Karri o''gay ukasi quruqlik olamiga qarshi katta urush boshlamasligi uchun o''z xalqiga yetakchilik qilishi va afsonaviy uch ayri nayzani topishi shart.', 'https://m.media-amazon.com/images/M/MV5BOTk5ODg0OTU5M15BMl5BanBnXkFtZTgwMDQ3MDY3NjM@._V1_FMjpg_UX800_.jpg', 'https://i.ytimg.com/vi/WDkg3h8PCVU/maxresdefault.jpg', 'https://www.youtube.com/watch?v=WDkg3h8PCVU', 'https://www.youtube.com/watch?v=WDkg3h8PCVU',
  '2026-11-05T20:24:00Z', now()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  original_title = EXCLUDED.original_title,
  category = EXCLUDED.category,
  studio = EXCLUDED.studio,
  genres = EXCLUDED.genres,
  year = EXCLUDED.year,
  country = EXCLUDED.country,
  duration = EXCLUDED.duration,
  quality = EXCLUDED.quality,
  age_rating = EXCLUDED.age_rating,
  imdb_rating = EXCLUDED.imdb_rating,
  kp_rating = EXCLUDED.kp_rating,
  views = EXCLUDED.views,
  is_premiere = EXCLUDED.is_premiere,
  is_featured = EXCLUDED.is_featured,
  director = EXCLUDED.director,
  cast_members = EXCLUDED.cast_members,
  description = EXCLUDED.description,
  poster_url = EXCLUDED.poster_url,
  backdrop_url = EXCLUDED.backdrop_url,
  video_url = EXCLUDED.video_url,
  trailer_url = EXCLUDED.trailer_url,
  created_at = EXCLUDED.created_at,
  updated_at = now();

INSERT INTO public.movies (
  slug, title, original_title, category, studio, genres, year, country, duration,
  quality, age_rating, imdb_rating, kp_rating, views, is_premiere, is_featured,
  director, cast_members, description, poster_url, backdrop_url, video_url, trailer_url, created_at, updated_at
) VALUES (
  'polat-odam', 'Po''lat Odam (Supermen)', 'Man of Steel', 'tarjima', 'DC Studios',
  ARRAY['Jangari', 'Fantastika', 'Sarguzasht'], 2013, 'AQSH', '2 s 23 daq',
  '1080p Full HD', '12+', 7.1, 6.9, 334700,
  false, false, 'Zak Snayder', ARRAY['Genri Kavill', 'Emi Adams', 'Maykl Shennon', 'Rassel Krou', 'Kevin Kostner'],
  'Halokatga uchragan Kripton sayyorasidan Yerga yuborilgan Klark Kent o''zidagi g''ayritabiiy kuch sababini anglaydi. General Zod Yerga hujum qilganda, u insoniyat umidi — Supermenga aylanishi lozim.', 'https://m.media-amazon.com/images/M/MV5BMTk5ODk1NDkxMF5BMl5BanBnXkFtZTcwNTA5OTY0OQ@@._V1_FMjpg_UX800_.jpg', 'https://i.ytimg.com/vi/T6DJcgm3wNY/maxresdefault.jpg', 'https://www.youtube.com/watch?v=T6DJcgm3wNY', 'https://www.youtube.com/watch?v=T6DJcgm3wNY',
  '2026-11-05T20:23:00Z', now()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  original_title = EXCLUDED.original_title,
  category = EXCLUDED.category,
  studio = EXCLUDED.studio,
  genres = EXCLUDED.genres,
  year = EXCLUDED.year,
  country = EXCLUDED.country,
  duration = EXCLUDED.duration,
  quality = EXCLUDED.quality,
  age_rating = EXCLUDED.age_rating,
  imdb_rating = EXCLUDED.imdb_rating,
  kp_rating = EXCLUDED.kp_rating,
  views = EXCLUDED.views,
  is_premiere = EXCLUDED.is_premiere,
  is_featured = EXCLUDED.is_featured,
  director = EXCLUDED.director,
  cast_members = EXCLUDED.cast_members,
  description = EXCLUDED.description,
  poster_url = EXCLUDED.poster_url,
  backdrop_url = EXCLUDED.backdrop_url,
  video_url = EXCLUDED.video_url,
  trailer_url = EXCLUDED.trailer_url,
  created_at = EXCLUDED.created_at,
  updated_at = now();

INSERT INTO public.movies (
  slug, title, original_title, category, studio, genres, year, country, duration,
  quality, age_rating, imdb_rating, kp_rating, views, is_premiere, is_featured,
  director, cast_members, description, poster_url, backdrop_url, video_url, trailer_url, created_at, updated_at
) VALUES (
  'avatar-suv-yoli', 'Avatar: Suv yo''li', 'Avatar: The Way of Water', 'tarjima', '20th Century Fox',
  ARRAY['Fantastika', 'Sarguzasht', 'Jangari'], 2022, 'AQSH', '3 s 12 daq',
  '4K Ultra HD', '12+', 7.5, 7.8, 618000,
  true, true, 'Jeyms Kemeron', ARRAY['Sem Uortington', 'Zoi Saldana', 'Sigurni Uiver', 'Stiven Leng', 'Keyt Uinslet'],
  'Jeyk Salli va Neytiri o''z farzandlarini eski dushman tahdididan asrash uchun o''rmonni tark etib, Pandora okeanlarida yashovchi Metkayina qabilasidan panoh so''raydilar.', 'https://m.media-amazon.com/images/M/MV5BNWI0Y2NkOWEtMmM2OC00MjQ3LWI1YzItZGQxYzQ3NzI4NWZmXkEyXkFqcGc@._V1_FMjpg_UX800_.jpg', 'https://i.ytimg.com/vi/d9MyW72ELq0/maxresdefault.jpg', 'https://www.youtube.com/watch?v=d9MyW72ELq0', 'https://www.youtube.com/watch?v=d9MyW72ELq0',
  '2026-11-05T20:22:00Z', now()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  original_title = EXCLUDED.original_title,
  category = EXCLUDED.category,
  studio = EXCLUDED.studio,
  genres = EXCLUDED.genres,
  year = EXCLUDED.year,
  country = EXCLUDED.country,
  duration = EXCLUDED.duration,
  quality = EXCLUDED.quality,
  age_rating = EXCLUDED.age_rating,
  imdb_rating = EXCLUDED.imdb_rating,
  kp_rating = EXCLUDED.kp_rating,
  views = EXCLUDED.views,
  is_premiere = EXCLUDED.is_premiere,
  is_featured = EXCLUDED.is_featured,
  director = EXCLUDED.director,
  cast_members = EXCLUDED.cast_members,
  description = EXCLUDED.description,
  poster_url = EXCLUDED.poster_url,
  backdrop_url = EXCLUDED.backdrop_url,
  video_url = EXCLUDED.video_url,
  trailer_url = EXCLUDED.trailer_url,
  created_at = EXCLUDED.created_at,
  updated_at = now();

INSERT INTO public.movies (
  slug, title, original_title, category, studio, genres, year, country, duration,
  quality, age_rating, imdb_rating, kp_rating, views, is_premiere, is_featured,
  director, cast_members, description, poster_url, backdrop_url, video_url, trailer_url, created_at, updated_at
) VALUES (
  'avatar-2009', 'Avatar', 'Avatar', 'tarjima', '20th Century Fox',
  ARRAY['Fantastika', 'Sarguzasht', 'Jangari', 'Fentezi'], 2009, 'AQSH', '2 s 42 daq',
  '4K Ultra HD', '12+', 7.9, 8, 645000,
  false, false, 'Jeyms Kemeron', ARRAY['Sem Uortington', 'Zoi Saldana', 'Sigurni Uiver', 'Mishel Rodriges'],
  'Sobiq dengiz piyodasi Jeyk Salli olis Pandora sayyorasiga maxsus ''Avatar'' dasturi bo''yicha yuboriladi. Mahalliy Na''vi xalqi malikasi Neytiri bilan tanishgach, u Pandora tabiatini bosqinchilardan himoya qilishga otlanadi.', 'https://m.media-amazon.com/images/M/MV5BMDEzMmQwZjctZWU2My00MWNlLWE0NjItMDJlYTRlNGJiZjcyXkEyXkFqcGc@._V1_FMjpg_UX800_.jpg', 'https://i.ytimg.com/vi/5PSNL1qE6VY/maxresdefault.jpg', 'https://www.youtube.com/watch?v=5PSNL1qE6VY', 'https://www.youtube.com/watch?v=5PSNL1qE6VY',
  '2026-11-05T20:21:00Z', now()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  original_title = EXCLUDED.original_title,
  category = EXCLUDED.category,
  studio = EXCLUDED.studio,
  genres = EXCLUDED.genres,
  year = EXCLUDED.year,
  country = EXCLUDED.country,
  duration = EXCLUDED.duration,
  quality = EXCLUDED.quality,
  age_rating = EXCLUDED.age_rating,
  imdb_rating = EXCLUDED.imdb_rating,
  kp_rating = EXCLUDED.kp_rating,
  views = EXCLUDED.views,
  is_premiere = EXCLUDED.is_premiere,
  is_featured = EXCLUDED.is_featured,
  director = EXCLUDED.director,
  cast_members = EXCLUDED.cast_members,
  description = EXCLUDED.description,
  poster_url = EXCLUDED.poster_url,
  backdrop_url = EXCLUDED.backdrop_url,
  video_url = EXCLUDED.video_url,
  trailer_url = EXCLUDED.trailer_url,
  created_at = EXCLUDED.created_at,
  updated_at = now();

INSERT INTO public.movies (
  slug, title, original_title, category, studio, genres, year, country, duration,
  quality, age_rating, imdb_rating, kp_rating, views, is_premiere, is_featured,
  director, cast_members, description, poster_url, backdrop_url, video_url, trailer_url, created_at, updated_at
) VALUES (
  'dedpul-va-rosomaxa', 'Dedpul va Rosomaxa', 'Deadpool & Wolverine', 'tarjima', '20th Century Fox',
  ARRAY['Jangari', 'Komediya', 'Fantastika'], 2024, 'AQSH', '2 s 08 daq',
  '4K Ultra HD', '18+', 7.6, 7.4, 584200,
  true, true, 'Shon Levi', ARRAY['Rayan Reynolds', 'Xyu Jekman', 'Emma Korrin', 'Mettyu Makfadyen'],
  'Tinch hayot kechirayotgan Ueyd Uilson o''z koinoti yo''q bo''lib ketish arafasida ekanini bilgach, boshqa olamdagi qaysar Rosomaxa bilan birlashib, aqlbovar qilmas sarguzashtga sho''ng''iydi.', 'https://m.media-amazon.com/images/M/MV5BZTk5ODY0MmQtMzA3Ni00NGY1LThiYzItZThiNjFiNDM4MTM3XkEyXkFqcGc@._V1_FMjpg_UX800_.jpg', 'https://i.ytimg.com/vi/73_1biulkYk/maxresdefault.jpg', 'https://www.youtube.com/watch?v=73_1biulkYk', 'https://www.youtube.com/watch?v=73_1biulkYk',
  '2026-11-05T20:20:00Z', now()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  original_title = EXCLUDED.original_title,
  category = EXCLUDED.category,
  studio = EXCLUDED.studio,
  genres = EXCLUDED.genres,
  year = EXCLUDED.year,
  country = EXCLUDED.country,
  duration = EXCLUDED.duration,
  quality = EXCLUDED.quality,
  age_rating = EXCLUDED.age_rating,
  imdb_rating = EXCLUDED.imdb_rating,
  kp_rating = EXCLUDED.kp_rating,
  views = EXCLUDED.views,
  is_premiere = EXCLUDED.is_premiere,
  is_featured = EXCLUDED.is_featured,
  director = EXCLUDED.director,
  cast_members = EXCLUDED.cast_members,
  description = EXCLUDED.description,
  poster_url = EXCLUDED.poster_url,
  backdrop_url = EXCLUDED.backdrop_url,
  video_url = EXCLUDED.video_url,
  trailer_url = EXCLUDED.trailer_url,
  created_at = EXCLUDED.created_at,
  updated_at = now();

INSERT INTO public.movies (
  slug, title, original_title, category, studio, genres, year, country, duration,
  quality, age_rating, imdb_rating, kp_rating, views, is_premiere, is_featured,
  director, cast_members, description, poster_url, backdrop_url, video_url, trailer_url, created_at, updated_at
) VALUES (
  'logan', 'Logan: Rosomaxa', 'Logan', 'tarjima', '20th Century Fox',
  ARRAY['Jangari', 'Drama', 'Fantastika'], 2017, 'AQSH', '2 s 17 daq',
  '4K Ultra HD', '18+', 8.1, 7.6, 392000,
  false, false, 'Jeyms Mengold', ARRAY['Xyu Jekman', 'Patrik Styuart', 'Dafni Kin', 'Boyd Xolbruk'],
  'Yaqin kelajakda kuchdan qolgan Logan bemor professor Charlz Ksavyega g''amxo''rlik qilib yashirinib yuradi. Ammo yovuz korporatsiya ta''qibidagi yosh mutant qizcha paydo bo''lgach, Rosomaxa yana tirnoqlarini chiqarishga majbur bo''ladi.', 'https://m.media-amazon.com/images/M/MV5BM2JjODdkMGMtNmY2YS00OGM2LThiY2YtZGYyNzE4Nzc2ODA0XkEyXkFqcGc@._V1_FMjpg_UX800_.jpg', 'https://i.ytimg.com/vi/Div0iP65aZo/maxresdefault.jpg', 'https://www.youtube.com/watch?v=Div0iP65aZo', 'https://www.youtube.com/watch?v=Div0iP65aZo',
  '2026-11-05T20:19:00Z', now()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  original_title = EXCLUDED.original_title,
  category = EXCLUDED.category,
  studio = EXCLUDED.studio,
  genres = EXCLUDED.genres,
  year = EXCLUDED.year,
  country = EXCLUDED.country,
  duration = EXCLUDED.duration,
  quality = EXCLUDED.quality,
  age_rating = EXCLUDED.age_rating,
  imdb_rating = EXCLUDED.imdb_rating,
  kp_rating = EXCLUDED.kp_rating,
  views = EXCLUDED.views,
  is_premiere = EXCLUDED.is_premiere,
  is_featured = EXCLUDED.is_featured,
  director = EXCLUDED.director,
  cast_members = EXCLUDED.cast_members,
  description = EXCLUDED.description,
  poster_url = EXCLUDED.poster_url,
  backdrop_url = EXCLUDED.backdrop_url,
  video_url = EXCLUDED.video_url,
  trailer_url = EXCLUDED.trailer_url,
  created_at = EXCLUDED.created_at,
  updated_at = now();

INSERT INTO public.movies (
  slug, title, original_title, category, studio, genres, year, country, duration,
  quality, age_rating, imdb_rating, kp_rating, views, is_premiere, is_featured,
  director, cast_members, description, poster_url, backdrop_url, video_url, trailer_url, created_at, updated_at
) VALUES (
  'ford-ferrariga-qarshi', 'Ford Ferrariga qarshi', 'Ford v Ferrari', 'tarjima', '20th Century Fox',
  ARRAY['Drama', 'Jangari', 'Tarixiy'], 2019, 'AQSH', '2 s 32 daq',
  '4K Ultra HD', '16+', 8.1, 8.2, 410500,
  false, false, 'Jeyms Mengold', ARRAY['Mett Deymon', 'Kristian Beyl', 'Jon Berntal', 'Katrina Balf'],
  'Amerikalik avtomobil konstruktori Kerroll Shelbi va jasur britaniyalik poygachi Ken Maylz 1966-yilgi afsonaviy ''Le-Man 24 soat'' poygasida yengilmas Ferrarini mag''lub etish uchun inqilobiy poyga mashinasini yaratadilar.', 'https://m.media-amazon.com/images/M/MV5BOTBjNTEyNjYtYjdkNi00YzE5LTljYzUtZjVlYmYwZmJmZWYxXkEyXkFqcGc@._V1_FMjpg_UX800_.jpg', 'https://i.ytimg.com/vi/zyYgDtY2AMY/maxresdefault.jpg', 'https://www.youtube.com/watch?v=zyYgDtY2AMY', 'https://www.youtube.com/watch?v=zyYgDtY2AMY',
  '2026-11-05T20:18:00Z', now()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  original_title = EXCLUDED.original_title,
  category = EXCLUDED.category,
  studio = EXCLUDED.studio,
  genres = EXCLUDED.genres,
  year = EXCLUDED.year,
  country = EXCLUDED.country,
  duration = EXCLUDED.duration,
  quality = EXCLUDED.quality,
  age_rating = EXCLUDED.age_rating,
  imdb_rating = EXCLUDED.imdb_rating,
  kp_rating = EXCLUDED.kp_rating,
  views = EXCLUDED.views,
  is_premiere = EXCLUDED.is_premiere,
  is_featured = EXCLUDED.is_featured,
  director = EXCLUDED.director,
  cast_members = EXCLUDED.cast_members,
  description = EXCLUDED.description,
  poster_url = EXCLUDED.poster_url,
  backdrop_url = EXCLUDED.backdrop_url,
  video_url = EXCLUDED.video_url,
  trailer_url = EXCLUDED.trailer_url,
  created_at = EXCLUDED.created_at,
  updated_at = now();

INSERT INTO public.movies (
  slug, title, original_title, category, studio, genres, year, country, duration,
  quality, age_rating, imdb_rating, kp_rating, views, is_premiere, is_featured,
  director, cast_members, description, poster_url, backdrop_url, video_url, trailer_url, created_at, updated_at
) VALUES (
  'interstellar-yulduzlararo', 'Interstellar: Yulduzlararo', 'Interstellar', 'tarjima', 'Warner Bros.',
  ARRAY['Fantastika', 'Drama', 'Sarguzasht'], 2014, 'AQSH', '2 s 49 daq',
  '4K Ultra HD', '12+', 8.7, 8.6, 742000,
  false, true, 'Kristofer Nolan', ARRAY['Mettyu Makkonaxi', 'Enn Xeteuey', 'Jessika Chesteyn', 'Maykl Keyn'],
  'Yer sayyorasi ekologik halokat yoqasiga kelib qolganda, sobiq uchuvchi Kuper va olimlar guruhi insoniyat uchun yashashga yaroqli yangi sayyora topish maqsadida fazoviy tuynuk orqali o''zga galaktikaga parvoz qiladilar.', 'https://m.media-amazon.com/images/M/MV5BYzdjMDAxZGItMjI2My00ODA1LTlkNzItOWFjMDU5ZDJlYWY3XkEyXkFqcGc@._V1_FMjpg_UX800_.jpg', 'https://i.ytimg.com/vi/zSWdZVtXT7E/maxresdefault.jpg', 'https://www.youtube.com/watch?v=zSWdZVtXT7E', 'https://www.youtube.com/watch?v=zSWdZVtXT7E',
  '2026-11-05T20:17:00Z', now()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  original_title = EXCLUDED.original_title,
  category = EXCLUDED.category,
  studio = EXCLUDED.studio,
  genres = EXCLUDED.genres,
  year = EXCLUDED.year,
  country = EXCLUDED.country,
  duration = EXCLUDED.duration,
  quality = EXCLUDED.quality,
  age_rating = EXCLUDED.age_rating,
  imdb_rating = EXCLUDED.imdb_rating,
  kp_rating = EXCLUDED.kp_rating,
  views = EXCLUDED.views,
  is_premiere = EXCLUDED.is_premiere,
  is_featured = EXCLUDED.is_featured,
  director = EXCLUDED.director,
  cast_members = EXCLUDED.cast_members,
  description = EXCLUDED.description,
  poster_url = EXCLUDED.poster_url,
  backdrop_url = EXCLUDED.backdrop_url,
  video_url = EXCLUDED.video_url,
  trailer_url = EXCLUDED.trailer_url,
  created_at = EXCLUDED.created_at,
  updated_at = now();

INSERT INTO public.movies (
  slug, title, original_title, category, studio, genres, year, country, duration,
  quality, age_rating, imdb_rating, kp_rating, views, is_premiere, is_featured,
  director, cast_members, description, poster_url, backdrop_url, video_url, trailer_url, created_at, updated_at
) VALUES (
  'muqaddima', 'Muqaddima (Ibtido)', 'Inception', 'tarjima', 'Warner Bros.',
  ARRAY['Fantastika', 'Jangari', 'Triller'], 2010, 'AQSH', '2 s 28 daq',
  '4K Ultra HD', '12+', 8.8, 8.7, 682000,
  false, false, 'Kristofer Nolan', ARRAY['Leonardo DiKaprio', 'Jozef Gordon-Levitt', 'Tom Xardi', 'Killian Myorfi'],
  'Dom Kobb — insonlarning ongi ostiga tush vaqtida kirib, eng maxfiy sirlarni o''g''irlash bo''yicha tengsiz mutaxassis. Endi unga aksincha — o''zga inson ongiga g''oya joylashtirishdek imkonsiz topshiriq beriladi.', 'https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_FMjpg_UX800_.jpg', 'https://i.ytimg.com/vi/YoHD9XEInc0/maxresdefault.jpg', 'https://www.youtube.com/watch?v=YoHD9XEInc0', 'https://www.youtube.com/watch?v=YoHD9XEInc0',
  '2026-11-05T20:16:00Z', now()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  original_title = EXCLUDED.original_title,
  category = EXCLUDED.category,
  studio = EXCLUDED.studio,
  genres = EXCLUDED.genres,
  year = EXCLUDED.year,
  country = EXCLUDED.country,
  duration = EXCLUDED.duration,
  quality = EXCLUDED.quality,
  age_rating = EXCLUDED.age_rating,
  imdb_rating = EXCLUDED.imdb_rating,
  kp_rating = EXCLUDED.kp_rating,
  views = EXCLUDED.views,
  is_premiere = EXCLUDED.is_premiere,
  is_featured = EXCLUDED.is_featured,
  director = EXCLUDED.director,
  cast_members = EXCLUDED.cast_members,
  description = EXCLUDED.description,
  poster_url = EXCLUDED.poster_url,
  backdrop_url = EXCLUDED.backdrop_url,
  video_url = EXCLUDED.video_url,
  trailer_url = EXCLUDED.trailer_url,
  created_at = EXCLUDED.created_at,
  updated_at = now();

INSERT INTO public.movies (
  slug, title, original_title, category, studio, genres, year, country, duration,
  quality, age_rating, imdb_rating, kp_rating, views, is_premiere, is_featured,
  director, cast_members, description, poster_url, backdrop_url, video_url, trailer_url, created_at, updated_at
) VALUES (
  'dyuna-ikkinchi-qism', 'Dyuna: Ikkinchi qism', 'Dune: Part Two', 'tarjima', 'Warner Bros.',
  ARRAY['Fantastika', 'Jangari', 'Drama', 'Sarguzasht'], 2024, 'AQSH', '2 s 46 daq',
  '4K Ultra HD', '16+', 8.5, 8.2, 495000,
  true, true, 'Deni Vilnyov', ARRAY['Timoti Shalame', 'Zendaya', 'Rebekka Fergyuson', 'Xavyer Bardem', 'Ostin Batler'],
  'Pol Atreydes sahro jangchilari — fremenlar va Chani bilan birlashib, uning oilasini yo''q qilgan fitnachilarga qarshi intiqom urushini boshlaydi hamda butun koinot kelajagini belgilovchi tanlov oldida turadi.', 'https://m.media-amazon.com/images/M/MV5BNTc0YmQxMjEtODI5MC00NjFiLTlkMWUtOGQ5NjFmYWUyZGJhXkEyXkFqcGc@._V1_FMjpg_UX800_.jpg', 'https://i.ytimg.com/vi/Way9Dexny3w/maxresdefault.jpg', 'https://www.youtube.com/watch?v=Way9Dexny3w', 'https://www.youtube.com/watch?v=Way9Dexny3w',
  '2026-11-05T20:15:00Z', now()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  original_title = EXCLUDED.original_title,
  category = EXCLUDED.category,
  studio = EXCLUDED.studio,
  genres = EXCLUDED.genres,
  year = EXCLUDED.year,
  country = EXCLUDED.country,
  duration = EXCLUDED.duration,
  quality = EXCLUDED.quality,
  age_rating = EXCLUDED.age_rating,
  imdb_rating = EXCLUDED.imdb_rating,
  kp_rating = EXCLUDED.kp_rating,
  views = EXCLUDED.views,
  is_premiere = EXCLUDED.is_premiere,
  is_featured = EXCLUDED.is_featured,
  director = EXCLUDED.director,
  cast_members = EXCLUDED.cast_members,
  description = EXCLUDED.description,
  poster_url = EXCLUDED.poster_url,
  backdrop_url = EXCLUDED.backdrop_url,
  video_url = EXCLUDED.video_url,
  trailer_url = EXCLUDED.trailer_url,
  created_at = EXCLUDED.created_at,
  updated_at = now();

INSERT INTO public.movies (
  slug, title, original_title, category, studio, genres, year, country, duration,
  quality, age_rating, imdb_rating, kp_rating, views, is_premiere, is_featured,
  director, cast_members, description, poster_url, backdrop_url, video_url, trailer_url, created_at, updated_at
) VALUES (
  'matritsa', 'Matritsa', 'The Matrix', 'tarjima', 'Warner Bros.',
  ARRAY['Fantastika', 'Jangari'], 1999, 'AQSH', '2 s 16 daq',
  '4K Ultra HD', '16+', 8.7, 8.5, 560000,
  false, false, 'Lana va Lilli Vachovski', ARRAY['Kianu Rivz', 'Lorens Fishbyorn', 'Kerri-Enn Moss', 'Xyugo Uiving'],
  'Xaker Tomas Anderson (Neo) o''zi yashayotgan dunyo aslida aqlli mashinalar tomonidan yaratilgan simulyatsiya — Matritsa ekanligini bilib qoladi va insoniyat ozodligi uchun kurashga qo''shiladi.', 'https://m.media-amazon.com/images/M/MV5BN2NmN2VhMTQtMDNiOS00NDlhLTliMjgtODE2ZTY0ODQyNDRhXkEyXkFqcGc@._V1_FMjpg_UX800_.jpg', 'https://i.ytimg.com/vi/vKQi3bBA1y8/maxresdefault.jpg', 'https://www.youtube.com/watch?v=vKQi3bBA1y8', 'https://www.youtube.com/watch?v=vKQi3bBA1y8',
  '2026-11-05T20:14:00Z', now()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  original_title = EXCLUDED.original_title,
  category = EXCLUDED.category,
  studio = EXCLUDED.studio,
  genres = EXCLUDED.genres,
  year = EXCLUDED.year,
  country = EXCLUDED.country,
  duration = EXCLUDED.duration,
  quality = EXCLUDED.quality,
  age_rating = EXCLUDED.age_rating,
  imdb_rating = EXCLUDED.imdb_rating,
  kp_rating = EXCLUDED.kp_rating,
  views = EXCLUDED.views,
  is_premiere = EXCLUDED.is_premiere,
  is_featured = EXCLUDED.is_featured,
  director = EXCLUDED.director,
  cast_members = EXCLUDED.cast_members,
  description = EXCLUDED.description,
  poster_url = EXCLUDED.poster_url,
  backdrop_url = EXCLUDED.backdrop_url,
  video_url = EXCLUDED.video_url,
  trailer_url = EXCLUDED.trailer_url,
  created_at = EXCLUDED.created_at,
  updated_at = now();

INSERT INTO public.movies (
  slug, title, original_title, category, studio, genres, year, country, duration,
  quality, age_rating, imdb_rating, kp_rating, views, is_premiere, is_featured,
  director, cast_members, description, poster_url, backdrop_url, video_url, trailer_url, created_at, updated_at
) VALUES (
  'garri-potter-ajal-tuhfalari-2', 'Garri Potter va Ajal tuhfalari: 2-qism', 'Harry Potter and the Deathly Hallows: Part 2', 'tarjima', 'Warner Bros.',
  ARRAY['Fentezi', 'Sarguzasht', 'Oilaviy'], 2011, 'Buyuk Britaniya', '2 s 10 daq',
  '4K Ultra HD', '12+', 8.1, 8.2, 620400,
  false, false, 'Devid Yeyts', ARRAY['Deniel Redkliff', 'Emma Uotson', 'Rupert Grint', 'Ralf Fayns', 'Alan Rikman'],
  'Sehrgarlar olamidagi ezgulik va yovuzlik kuchlari o''rtasidagi hal qiluvchi urush boshlanadi. Xogvarts qal''asi devorlari ostida Garri Potter va Lord Voldemort o''rtasida so''nggi jang bo''lib o''tadi.', 'https://m.media-amazon.com/images/M/MV5BOTA1Mzc2N2ItZWRiNS00MjQzLTlmZDQtMjU0NmY1YWRkMGQ4XkEyXkFqcGc@._V1_FMjpg_UX800_.jpg', 'https://i.ytimg.com/vi/5NYt1qirBWg/maxresdefault.jpg', 'https://www.youtube.com/watch?v=5NYt1qirBWg', 'https://www.youtube.com/watch?v=5NYt1qirBWg',
  '2026-11-05T20:13:00Z', now()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  original_title = EXCLUDED.original_title,
  category = EXCLUDED.category,
  studio = EXCLUDED.studio,
  genres = EXCLUDED.genres,
  year = EXCLUDED.year,
  country = EXCLUDED.country,
  duration = EXCLUDED.duration,
  quality = EXCLUDED.quality,
  age_rating = EXCLUDED.age_rating,
  imdb_rating = EXCLUDED.imdb_rating,
  kp_rating = EXCLUDED.kp_rating,
  views = EXCLUDED.views,
  is_premiere = EXCLUDED.is_premiere,
  is_featured = EXCLUDED.is_featured,
  director = EXCLUDED.director,
  cast_members = EXCLUDED.cast_members,
  description = EXCLUDED.description,
  poster_url = EXCLUDED.poster_url,
  backdrop_url = EXCLUDED.backdrop_url,
  video_url = EXCLUDED.video_url,
  trailer_url = EXCLUDED.trailer_url,
  created_at = EXCLUDED.created_at,
  updated_at = now();

INSERT INTO public.movies (
  slug, title, original_title, category, studio, genres, year, country, duration,
  quality, age_rating, imdb_rating, kp_rating, views, is_premiere, is_featured,
  director, cast_members, description, poster_url, backdrop_url, video_url, trailer_url, created_at, updated_at
) VALUES (
  'godzilla-va-kong', 'Godzilla va Kong: Yangi imperiya', 'Godzilla x Kong: The New Empire', 'tarjima', 'Warner Bros.',
  ARRAY['Jangari', 'Fantastika', 'Sarguzasht'], 2024, 'AQSH', '1 s 55 daq',
  '4K Ultra HD', '12+', 6.1, 6.4, 388200,
  true, false, 'Adam Vingard', ARRAY['Rebekka Xoll', 'Brayan Tayri Genri', 'Den Stivens', 'Kayli Xottl'],
  'Qudratli Kong va dahshatli Godzilla Yer tubida yashiringan hamda titanlar va insoniyat hayotiga xavf solayotgan ulkan qadimiy yovuz kuchga qarshi elkama-elka kurashishga majbur bo''ladilar.', 'https://m.media-amazon.com/images/M/MV5BMTY0N2MzODctY2ExYy00OWYxLTkyNDItMTVhZGIxZjliZjU5XkEyXkFqcGc@._V1_FMjpg_UX800_.jpg', 'https://i.ytimg.com/vi/lV1OOlGwExM/maxresdefault.jpg', 'https://www.youtube.com/watch?v=lV1OOlGwExM', 'https://www.youtube.com/watch?v=lV1OOlGwExM',
  '2026-11-05T20:12:00Z', now()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  original_title = EXCLUDED.original_title,
  category = EXCLUDED.category,
  studio = EXCLUDED.studio,
  genres = EXCLUDED.genres,
  year = EXCLUDED.year,
  country = EXCLUDED.country,
  duration = EXCLUDED.duration,
  quality = EXCLUDED.quality,
  age_rating = EXCLUDED.age_rating,
  imdb_rating = EXCLUDED.imdb_rating,
  kp_rating = EXCLUDED.kp_rating,
  views = EXCLUDED.views,
  is_premiere = EXCLUDED.is_premiere,
  is_featured = EXCLUDED.is_featured,
  director = EXCLUDED.director,
  cast_members = EXCLUDED.cast_members,
  description = EXCLUDED.description,
  poster_url = EXCLUDED.poster_url,
  backdrop_url = EXCLUDED.backdrop_url,
  video_url = EXCLUDED.video_url,
  trailer_url = EXCLUDED.trailer_url,
  created_at = EXCLUDED.created_at,
  updated_at = now();

INSERT INTO public.movies (
  slug, title, original_title, category, studio, genres, year, country, duration,
  quality, age_rating, imdb_rating, kp_rating, views, is_premiere, is_featured,
  director, cast_members, description, poster_url, backdrop_url, video_url, trailer_url, created_at, updated_at
) VALUES (
  'ajdaho-uyi-serial', 'Ajdaho uyi', 'House of the Dragon', 'serial', 'Warner Bros.',
  ARRAY['Fentezi', 'Drama', 'Jangari', 'Sarguzasht'], 2024, 'AQSH', '60 daq / qism',
  '4K Ultra HD', '18+', 8.4, 8.1, 465000,
  true, false, 'Migel Sapochnik, Kler Kilner', ARRAY['Mett Smit', 'Emma D''Arsi', 'Oliviya Kuk', 'Ris Ivans'],
  '''Taxtlar o''yini'' voqealaridan 200 yil avval Targaryenlar sulolasi o''rtasida Temir taxt uchun boshlangan shafqatsiz fuqarolar urushi — ''Ajdaholar raqsi'' haqidagi epik serial.', 'https://m.media-amazon.com/images/M/MV5BOWU2ZDA0M2EtNWEyYy00MWUwLWI4NjAtYzkxMDFjYzZkNGFiXkEyXkFqcGc@._V1_FMjpg_UX800_.jpg', 'https://i.ytimg.com/vi/DotnJ7tTA34/maxresdefault.jpg', 'https://www.youtube.com/watch?v=DotnJ7tTA34', 'https://www.youtube.com/watch?v=DotnJ7tTA34',
  '2026-11-05T20:11:00Z', now()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  original_title = EXCLUDED.original_title,
  category = EXCLUDED.category,
  studio = EXCLUDED.studio,
  genres = EXCLUDED.genres,
  year = EXCLUDED.year,
  country = EXCLUDED.country,
  duration = EXCLUDED.duration,
  quality = EXCLUDED.quality,
  age_rating = EXCLUDED.age_rating,
  imdb_rating = EXCLUDED.imdb_rating,
  kp_rating = EXCLUDED.kp_rating,
  views = EXCLUDED.views,
  is_premiere = EXCLUDED.is_premiere,
  is_featured = EXCLUDED.is_featured,
  director = EXCLUDED.director,
  cast_members = EXCLUDED.cast_members,
  description = EXCLUDED.description,
  poster_url = EXCLUDED.poster_url,
  backdrop_url = EXCLUDED.backdrop_url,
  video_url = EXCLUDED.video_url,
  trailer_url = EXCLUDED.trailer_url,
  created_at = EXCLUDED.created_at,
  updated_at = now();

INSERT INTO public.episodes (movie_id, season_number, episode_number, title, duration, video_url)
SELECT id, 1, 1, 'Ajdaho merosxo''rlari', '66 daq', 'https://www.youtube.com/watch?v=DotnJ7tTA34'
FROM public.movies WHERE slug = 'ajdaho-uyi-serial'
ON CONFLICT (movie_id, season_number, episode_number) DO UPDATE SET
  title = EXCLUDED.title,
  duration = EXCLUDED.duration,
  video_url = EXCLUDED.video_url;

INSERT INTO public.episodes (movie_id, season_number, episode_number, title, duration, video_url)
SELECT id, 1, 2, 'Shahzoda Deymon', '54 daq', 'https://www.youtube.com/watch?v=YN2H_sKcmGw'
FROM public.movies WHERE slug = 'ajdaho-uyi-serial'
ON CONFLICT (movie_id, season_number, episode_number) DO UPDATE SET
  title = EXCLUDED.title,
  duration = EXCLUDED.duration,
  video_url = EXCLUDED.video_url;

INSERT INTO public.episodes (movie_id, season_number, episode_number, title, duration, video_url)
SELECT id, 2, 1, 'O''g''il uchun o''g''il', '59 daq', 'https://www.youtube.com/watch?v=DotnJ7tTA34'
FROM public.movies WHERE slug = 'ajdaho-uyi-serial'
ON CONFLICT (movie_id, season_number, episode_number) DO UPDATE SET
  title = EXCLUDED.title,
  duration = EXCLUDED.duration,
  video_url = EXCLUDED.video_url;

INSERT INTO public.episodes (movie_id, season_number, episode_number, title, duration, video_url)
SELECT id, 2, 2, 'Olovi va qoni', '64 daq', 'https://www.youtube.com/watch?v=YN2H_sKcmGw'
FROM public.movies WHERE slug = 'ajdaho-uyi-serial'
ON CONFLICT (movie_id, season_number, episode_number) DO UPDATE SET
  title = EXCLUDED.title,
  duration = EXCLUDED.duration,
  video_url = EXCLUDED.video_url;

INSERT INTO public.movies (
  slug, title, original_title, category, studio, genres, year, country, duration,
  quality, age_rating, imdb_rating, kp_rating, views, is_premiere, is_featured,
  director, cast_members, description, poster_url, backdrop_url, video_url, trailer_url, created_at, updated_at
) VALUES (
  'oppengeymer', 'Oppengeymer', 'Oppenheimer', 'tarjima', 'Universal Pictures',
  ARRAY['Tarixiy', 'Drama', 'Triller'], 2023, 'AQSH', '3 s 00 daq',
  '4K Ultra HD', '16+', 8.3, 8.2, 512000,
  false, false, 'Kristofer Nolan', ARRAY['Killian Myorfi', 'Emili Blant', 'Mett Deymon', 'Robert Dauni kich.', 'Florens Pyu'],
  'Ikkinchi jahon urushi yillarida maxfiy ''Manxetten'' loyihasiga rahbarlik qilgan fizik Robert Oppengeymer va insoniyat tarixini o''zgartirgan ilk atom qurolining yaratilishi haqida Oskarga sazovor bo''lgan shedevr.', 'https://m.media-amazon.com/images/M/MV5BN2JkMDc5MGQtZjg3YS00NmFiLWIyZmQtZTJmNTM5MjVmYTQ4XkEyXkFqcGc@._V1_FMjpg_UX800_.jpg', 'https://i.ytimg.com/vi/uYPbbksJxIg/maxresdefault.jpg', 'https://www.youtube.com/watch?v=uYPbbksJxIg', 'https://www.youtube.com/watch?v=uYPbbksJxIg',
  '2026-11-05T20:10:00Z', now()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  original_title = EXCLUDED.original_title,
  category = EXCLUDED.category,
  studio = EXCLUDED.studio,
  genres = EXCLUDED.genres,
  year = EXCLUDED.year,
  country = EXCLUDED.country,
  duration = EXCLUDED.duration,
  quality = EXCLUDED.quality,
  age_rating = EXCLUDED.age_rating,
  imdb_rating = EXCLUDED.imdb_rating,
  kp_rating = EXCLUDED.kp_rating,
  views = EXCLUDED.views,
  is_premiere = EXCLUDED.is_premiere,
  is_featured = EXCLUDED.is_featured,
  director = EXCLUDED.director,
  cast_members = EXCLUDED.cast_members,
  description = EXCLUDED.description,
  poster_url = EXCLUDED.poster_url,
  backdrop_url = EXCLUDED.backdrop_url,
  video_url = EXCLUDED.video_url,
  trailer_url = EXCLUDED.trailer_url,
  created_at = EXCLUDED.created_at,
  updated_at = now();

INSERT INTO public.movies (
  slug, title, original_title, category, studio, genres, year, country, duration,
  quality, age_rating, imdb_rating, kp_rating, views, is_premiere, is_featured,
  director, cast_members, description, poster_url, backdrop_url, video_url, trailer_url, created_at, updated_at
) VALUES (
  'forsaj-10', 'Forsaj 10', 'Fast X', 'tarjima', 'Universal Pictures',
  ARRAY['Jangari', 'Kriminal', 'Triller'], 2023, 'AQSH', '2 s 21 daq',
  '1080p Full HD', '16+', 5.7, 6, 448500,
  false, false, 'Lui Leterrye', ARRAY['Vin Dizel', 'Jeyson Momoa', 'Mishel Rodriges', 'Jeyson Stetxem', 'Jon Sina'],
  'Dominik Toretto va uning oilasi o''tmish soyasidan chiqqan eng xavfli va qasoskor dushman — narkobaron o''g''li Dante Reyesga qarshi Rimdan Rio-de-Janeyrogacha shiddatli kurash olib boradi.', 'https://m.media-amazon.com/images/M/MV5BYzEwZjczOTktYzU1OS00YjJlLTgyY2UtNWEzODBlN2RjZDEwXkEyXkFqcGc@._V1_FMjpg_UX800_.jpg', 'https://i.ytimg.com/vi/32RAq6JzY-w/maxresdefault.jpg', 'https://www.youtube.com/watch?v=32RAq6JzY-w', 'https://www.youtube.com/watch?v=32RAq6JzY-w',
  '2026-11-05T20:09:00Z', now()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  original_title = EXCLUDED.original_title,
  category = EXCLUDED.category,
  studio = EXCLUDED.studio,
  genres = EXCLUDED.genres,
  year = EXCLUDED.year,
  country = EXCLUDED.country,
  duration = EXCLUDED.duration,
  quality = EXCLUDED.quality,
  age_rating = EXCLUDED.age_rating,
  imdb_rating = EXCLUDED.imdb_rating,
  kp_rating = EXCLUDED.kp_rating,
  views = EXCLUDED.views,
  is_premiere = EXCLUDED.is_premiere,
  is_featured = EXCLUDED.is_featured,
  director = EXCLUDED.director,
  cast_members = EXCLUDED.cast_members,
  description = EXCLUDED.description,
  poster_url = EXCLUDED.poster_url,
  backdrop_url = EXCLUDED.backdrop_url,
  video_url = EXCLUDED.video_url,
  trailer_url = EXCLUDED.trailer_url,
  created_at = EXCLUDED.created_at,
  updated_at = now();

INSERT INTO public.movies (
  slug, title, original_title, category, studio, genres, year, country, duration,
  quality, age_rating, imdb_rating, kp_rating, views, is_premiere, is_featured,
  director, cast_members, description, poster_url, backdrop_url, video_url, trailer_url, created_at, updated_at
) VALUES (
  'yura-davri-olami-3', 'Yura davri olami: Hukmronlik', 'Jurassic World Dominion', 'tarjima', 'Universal Pictures',
  ARRAY['Fantastika', 'Sarguzasht', 'Jangari'], 2022, 'AQSH', '2 s 27 daq',
  '4K Ultra HD', '12+', 5.6, 6, 361000,
  false, false, 'Kolin Trevorrou', ARRAY['Kris Pratt', 'Brays Dallas Xovard', 'Sem Nil', 'Lora Dern', 'Jeff Goldblyum'],
  'Nublar oroli vayron bo''lganidan to''rt yil o''tib, dinozavrlar butun Yer yuzi bo''ylab insonlar bilan yonma-yon yashamoqda va ov qilmoqda. Tabiatdagi nozik muvozanat kelajakda kim hukmron bo''lishini hal qiladi.', 'https://m.media-amazon.com/images/M/MV5BZGExMWU2NWMtNzczYi00NjQ4LTk2YzctZGZkYmRmMDdhMjllXkEyXkFqcGc@._V1_FMjpg_UX800_.jpg', 'https://i.ytimg.com/vi/fb5ELWi-ekk/maxresdefault.jpg', 'https://www.youtube.com/watch?v=fb5ELWi-ekk', 'https://www.youtube.com/watch?v=fb5ELWi-ekk',
  '2026-11-05T20:08:00Z', now()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  original_title = EXCLUDED.original_title,
  category = EXCLUDED.category,
  studio = EXCLUDED.studio,
  genres = EXCLUDED.genres,
  year = EXCLUDED.year,
  country = EXCLUDED.country,
  duration = EXCLUDED.duration,
  quality = EXCLUDED.quality,
  age_rating = EXCLUDED.age_rating,
  imdb_rating = EXCLUDED.imdb_rating,
  kp_rating = EXCLUDED.kp_rating,
  views = EXCLUDED.views,
  is_premiere = EXCLUDED.is_premiere,
  is_featured = EXCLUDED.is_featured,
  director = EXCLUDED.director,
  cast_members = EXCLUDED.cast_members,
  description = EXCLUDED.description,
  poster_url = EXCLUDED.poster_url,
  backdrop_url = EXCLUDED.backdrop_url,
  video_url = EXCLUDED.video_url,
  trailer_url = EXCLUDED.trailer_url,
  created_at = EXCLUDED.created_at,
  updated_at = now();

INSERT INTO public.movies (
  slug, title, original_title, category, studio, genres, year, country, duration,
  quality, age_rating, imdb_rating, kp_rating, views, is_premiere, is_featured,
  director, cast_members, description, poster_url, backdrop_url, video_url, trailer_url, created_at, updated_at
) VALUES (
  'top-gan-meverik', 'Top Gan: Meverik', 'Top Gun: Maverick', 'tarjima', 'Paramount Pictures',
  ARRAY['Jangari', 'Drama'], 2022, 'AQSH', '2 s 10 daq',
  '4K Ultra HD', '12+', 8.2, 8.1, 472300,
  false, false, 'Jozef Kosinski', ARRAY['Tom Kruz', 'Maylz Teller', 'Jennifer Konnelli', 'Jon Xemm', 'Val Kilmer'],
  'O''ttiz yildan ortiq xizmat qilgan afsonaviy qiruvchi uchuvchi Pit ''Meverik'' Mitchell yosh bitiruvchilar guruhini hech kim tirik qaytmagan o''ta xavfli maxsus topshiriqqa tayyorlash uchun qaytadi.', 'https://m.media-amazon.com/images/M/MV5BMDBkZDNjMWEtOTdmMi00NmExLTg5MmMtNTFlYTJlNWY5YTdmXkEyXkFqcGc@._V1_FMjpg_UX800_.jpg', 'https://i.ytimg.com/vi/giXco2jaZ_4/maxresdefault.jpg', 'https://www.youtube.com/watch?v=giXco2jaZ_4', 'https://www.youtube.com/watch?v=giXco2jaZ_4',
  '2026-11-05T20:07:00Z', now()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  original_title = EXCLUDED.original_title,
  category = EXCLUDED.category,
  studio = EXCLUDED.studio,
  genres = EXCLUDED.genres,
  year = EXCLUDED.year,
  country = EXCLUDED.country,
  duration = EXCLUDED.duration,
  quality = EXCLUDED.quality,
  age_rating = EXCLUDED.age_rating,
  imdb_rating = EXCLUDED.imdb_rating,
  kp_rating = EXCLUDED.kp_rating,
  views = EXCLUDED.views,
  is_premiere = EXCLUDED.is_premiere,
  is_featured = EXCLUDED.is_featured,
  director = EXCLUDED.director,
  cast_members = EXCLUDED.cast_members,
  description = EXCLUDED.description,
  poster_url = EXCLUDED.poster_url,
  backdrop_url = EXCLUDED.backdrop_url,
  video_url = EXCLUDED.video_url,
  trailer_url = EXCLUDED.trailer_url,
  created_at = EXCLUDED.created_at,
  updated_at = now();

INSERT INTO public.movies (
  slug, title, original_title, category, studio, genres, year, country, duration,
  quality, age_rating, imdb_rating, kp_rating, views, is_premiere, is_featured,
  director, cast_members, description, poster_url, backdrop_url, video_url, trailer_url, created_at, updated_at
) VALUES (
  'uddalab-bolmas-topshiriq-7', 'Uddalab bo''lmas topshiriq 7', 'Mission: Impossible – Dead Reckoning', 'tarjima', 'Paramount Pictures',
  ARRAY['Jangari', 'Triller', 'Sarguzasht'], 2023, 'AQSH', '2 s 43 daq',
  '4K Ultra HD', '16+', 7.7, 7.5, 419600,
  true, false, 'Kristofer Makkuorri', ARRAY['Tom Kruz', 'Xeyli Etvell', 'Ving Reyms', 'Saymon Pegg', 'Rebekka Fergyuson'],
  'Itan Xant va uning IMF jamoasi insoniyatga xavf soluvchi sun''iy intellekt qurolini yovuz kuchlar qo''liga tushmasidan avval topib zararsizlantirish uchun dunyo bo''ylab xavfli poygaga kirishadi.', 'https://m.media-amazon.com/images/M/MV5BN2U4OTdmM2QtZTkxYy00ZmQyLTg2N2UtMDdmMGJmNDhlZDU1XkEyXkFqcGc@._V1_FMjpg_UX800_.jpg', 'https://i.ytimg.com/vi/avz06PDqDbM/maxresdefault.jpg', 'https://www.youtube.com/watch?v=avz06PDqDbM', 'https://www.youtube.com/watch?v=avz06PDqDbM',
  '2026-11-05T20:06:00Z', now()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  original_title = EXCLUDED.original_title,
  category = EXCLUDED.category,
  studio = EXCLUDED.studio,
  genres = EXCLUDED.genres,
  year = EXCLUDED.year,
  country = EXCLUDED.country,
  duration = EXCLUDED.duration,
  quality = EXCLUDED.quality,
  age_rating = EXCLUDED.age_rating,
  imdb_rating = EXCLUDED.imdb_rating,
  kp_rating = EXCLUDED.kp_rating,
  views = EXCLUDED.views,
  is_premiere = EXCLUDED.is_premiere,
  is_featured = EXCLUDED.is_featured,
  director = EXCLUDED.director,
  cast_members = EXCLUDED.cast_members,
  description = EXCLUDED.description,
  poster_url = EXCLUDED.poster_url,
  backdrop_url = EXCLUDED.backdrop_url,
  video_url = EXCLUDED.video_url,
  trailer_url = EXCLUDED.trailer_url,
  created_at = EXCLUDED.created_at,
  updated_at = now();

INSERT INTO public.movies (
  slug, title, original_title, category, studio, genres, year, country, duration,
  quality, age_rating, imdb_rating, kp_rating, views, is_premiere, is_featured,
  director, cast_members, description, poster_url, backdrop_url, video_url, trailer_url, created_at, updated_at
) VALUES (
  'venom-3', 'Venom: So''nggi raqs', 'Venom: The Last Dance', 'tarjima', 'Sony Pictures',
  ARRAY['Jangari', 'Fantastika', 'Sarguzasht'], 2024, 'AQSH', '1 s 49 daq',
  '4K Ultra HD', '16+', 6, 6.2, 463000,
  true, false, 'Kelli Marsel', ARRAY['Tom Xardi', 'Chivetel Ejiofor', 'Juno Templ', 'Ris Ivans'],
  'Eddi Brok va simbiont Venom ikki dunyo ta''qibiga uchraydi. Tarmoq torayib borar ekan, ikki ajralmas do''st o''zlarining so''nggi raqsiga nuqta qo''yuvchi og''ir qaror qabul qilishga majbur bo''lishadi.', 'https://m.media-amazon.com/images/M/MV5BZDMyYWU4NzItZDY0MC00ODE2LTkyYTMtMzNkNDdmYmFhZDg0XkEyXkFqcGc@._V1_FMjpg_UX800_.jpg', 'https://i.ytimg.com/vi/__2bjWbetsA/maxresdefault.jpg', 'https://www.youtube.com/watch?v=__2bjWbetsA', 'https://www.youtube.com/watch?v=__2bjWbetsA',
  '2026-11-05T20:05:00Z', now()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  original_title = EXCLUDED.original_title,
  category = EXCLUDED.category,
  studio = EXCLUDED.studio,
  genres = EXCLUDED.genres,
  year = EXCLUDED.year,
  country = EXCLUDED.country,
  duration = EXCLUDED.duration,
  quality = EXCLUDED.quality,
  age_rating = EXCLUDED.age_rating,
  imdb_rating = EXCLUDED.imdb_rating,
  kp_rating = EXCLUDED.kp_rating,
  views = EXCLUDED.views,
  is_premiere = EXCLUDED.is_premiere,
  is_featured = EXCLUDED.is_featured,
  director = EXCLUDED.director,
  cast_members = EXCLUDED.cast_members,
  description = EXCLUDED.description,
  poster_url = EXCLUDED.poster_url,
  backdrop_url = EXCLUDED.backdrop_url,
  video_url = EXCLUDED.video_url,
  trailer_url = EXCLUDED.trailer_url,
  created_at = EXCLUDED.created_at,
  updated_at = now();

INSERT INTO public.movies (
  slug, title, original_title, category, studio, genres, year, country, duration,
  quality, age_rating, imdb_rating, kp_rating, views, is_premiere, is_featured,
  director, cast_members, description, poster_url, backdrop_url, video_url, trailer_url, created_at, updated_at
) VALUES (
  'orgimchak-odam-olamlar-aro', 'O''rgimchak odam: Olamlar aro', 'Spider-Man: Across the Spider-Verse', 'multfilm', 'Sony Pictures',
  ARRAY['Fantastika', 'Sarguzasht', 'Jangari', 'Oilaviy'], 2023, 'AQSH', '2 s 20 daq',
  '4K Ultra HD', '6+', 8.6, 8.4, 438000,
  false, false, 'Joakim Dos Santos, Kemp Pauers', ARRAY['Shameyk Mur', 'Xeyli Steynfeld', 'Oskar Ayzek', 'Deniel Kaluya'],
  'Maylz Morales Gven Steysi bilan qayta uchrashib, multikoinot bo''ylab aqlbovar qilmas sarguzashtga otlanadi va u yerda barcha olamlarni himoya qiluvchi O''rgimchak-odamlar jamiyati bilan to''qnashadi.', 'https://m.media-amazon.com/images/M/MV5BNThiZjA3MjItZGY5Ni00ZmJhLWEwN2EtOTBlYTA4Y2E0M2ZmXkEyXkFqcGc@._V1_FMjpg_UX800_.jpg', 'https://i.ytimg.com/vi/cqGjhVJWtEg/maxresdefault.jpg', 'https://www.youtube.com/watch?v=cqGjhVJWtEg', 'https://www.youtube.com/watch?v=cqGjhVJWtEg',
  '2026-11-05T20:04:00Z', now()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  original_title = EXCLUDED.original_title,
  category = EXCLUDED.category,
  studio = EXCLUDED.studio,
  genres = EXCLUDED.genres,
  year = EXCLUDED.year,
  country = EXCLUDED.country,
  duration = EXCLUDED.duration,
  quality = EXCLUDED.quality,
  age_rating = EXCLUDED.age_rating,
  imdb_rating = EXCLUDED.imdb_rating,
  kp_rating = EXCLUDED.kp_rating,
  views = EXCLUDED.views,
  is_premiere = EXCLUDED.is_premiere,
  is_featured = EXCLUDED.is_featured,
  director = EXCLUDED.director,
  cast_members = EXCLUDED.cast_members,
  description = EXCLUDED.description,
  poster_url = EXCLUDED.poster_url,
  backdrop_url = EXCLUDED.backdrop_url,
  video_url = EXCLUDED.video_url,
  trailer_url = EXCLUDED.trailer_url,
  created_at = EXCLUDED.created_at,
  updated_at = now();

INSERT INTO public.movies (
  slug, title, original_title, category, studio, genres, year, country, duration,
  quality, age_rating, imdb_rating, kp_rating, views, is_premiere, is_featured,
  director, cast_members, description, poster_url, backdrop_url, video_url, trailer_url, created_at, updated_at
) VALUES (
  'boshqotirma-2', 'Boshqotirma 2', 'Inside Out 2', 'multfilm', 'Walt Disney Pictures',
  ARRAY['Komediya', 'Oilaviy', 'Sarguzasht'], 2024, 'AQSH', '1 s 36 daq',
  '4K Ultra HD', '0+', 7.6, 7.8, 521000,
  true, false, 'Kelsi Mann', ARRAY['Emi Poler', 'Mayya Xouk', 'Kensington Tollman', 'Fillis Smit'],
  'O''smirlik davriga qadam qo''ygan Raylining ong markazida katta o''zgarishlar boshlanadi: Quvonch va uning do''stlari yoniga Xavotir, Hasad va Zerikish kabi kutilmagan yangi tuyg''ular ko''chib keladi.', 'https://m.media-amazon.com/images/M/MV5BYWY3MDE2Y2UtOTE3Zi00MGUzLTg2MTItZjE1ZWVkMGVlODRmXkEyXkFqcGc@._V1_FMjpg_UX800_.jpg', 'https://i.ytimg.com/vi/LEjhY15eCx0/maxresdefault.jpg', 'https://www.youtube.com/watch?v=LEjhY15eCx0', 'https://www.youtube.com/watch?v=LEjhY15eCx0',
  '2026-11-05T20:03:00Z', now()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  original_title = EXCLUDED.original_title,
  category = EXCLUDED.category,
  studio = EXCLUDED.studio,
  genres = EXCLUDED.genres,
  year = EXCLUDED.year,
  country = EXCLUDED.country,
  duration = EXCLUDED.duration,
  quality = EXCLUDED.quality,
  age_rating = EXCLUDED.age_rating,
  imdb_rating = EXCLUDED.imdb_rating,
  kp_rating = EXCLUDED.kp_rating,
  views = EXCLUDED.views,
  is_premiere = EXCLUDED.is_premiere,
  is_featured = EXCLUDED.is_featured,
  director = EXCLUDED.director,
  cast_members = EXCLUDED.cast_members,
  description = EXCLUDED.description,
  poster_url = EXCLUDED.poster_url,
  backdrop_url = EXCLUDED.backdrop_url,
  video_url = EXCLUDED.video_url,
  trailer_url = EXCLUDED.trailer_url,
  created_at = EXCLUDED.created_at,
  updated_at = now();

INSERT INTO public.movies (
  slug, title, original_title, category, studio, genres, year, country, duration,
  quality, age_rating, imdb_rating, kp_rating, views, is_premiere, is_featured,
  director, cast_members, description, poster_url, backdrop_url, video_url, trailer_url, created_at, updated_at
) VALUES (
  'qirol-sher', 'Qirol Sher', 'The Lion King', 'multfilm', 'Walt Disney Pictures',
  ARRAY['Sarguzasht', 'Oilaviy', 'Drama'], 2019, 'AQSH', '1 s 58 daq',
  '4K Ultra HD', '6+', 6.8, 7.2, 487000,
  false, false, 'Jon Favro', ARRAY['Donald Glover', 'Beyonse', 'Jeyms Erl Jons', 'Chivetel Ejiofor'],
  'Afrika savannasida yovuz amakisi Skarning xiyonatidan so''ng quvg''in qilingan yosh shershoh Simba sodiq do''stlari Timon va Pumba yordamida ulg''ayib, o''z qonuniy taxtini qaytarib olish uchun qaytadi.', 'https://m.media-amazon.com/images/M/MV5BMjIwMjE1Nzc4NV5BMl5BanBnXkFtZTgwNDg4OTA1NzM@._V1_FMjpg_UX800_.jpg', 'https://i.ytimg.com/vi/7TavVZMewpY/maxresdefault.jpg', 'https://www.youtube.com/watch?v=7TavVZMewpY', 'https://www.youtube.com/watch?v=7TavVZMewpY',
  '2026-11-05T20:02:00Z', now()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  original_title = EXCLUDED.original_title,
  category = EXCLUDED.category,
  studio = EXCLUDED.studio,
  genres = EXCLUDED.genres,
  year = EXCLUDED.year,
  country = EXCLUDED.country,
  duration = EXCLUDED.duration,
  quality = EXCLUDED.quality,
  age_rating = EXCLUDED.age_rating,
  imdb_rating = EXCLUDED.imdb_rating,
  kp_rating = EXCLUDED.kp_rating,
  views = EXCLUDED.views,
  is_premiere = EXCLUDED.is_premiere,
  is_featured = EXCLUDED.is_featured,
  director = EXCLUDED.director,
  cast_members = EXCLUDED.cast_members,
  description = EXCLUDED.description,
  poster_url = EXCLUDED.poster_url,
  backdrop_url = EXCLUDED.backdrop_url,
  video_url = EXCLUDED.video_url,
  trailer_url = EXCLUDED.trailer_url,
  created_at = EXCLUDED.created_at,
  updated_at = now();

INSERT INTO public.movies (
  slug, title, original_title, category, studio, genres, year, country, duration,
  quality, age_rating, imdb_rating, kp_rating, views, is_premiere, is_featured,
  director, cast_members, description, poster_url, backdrop_url, video_url, trailer_url, created_at, updated_at
) VALUES (
  'kalmar-oyini-serial', 'Kalmar o''yini', 'Squid Game', 'serial', 'Netflix Studios',
  ARRAY['Triller', 'Drama', 'Detektiv'], 2024, 'Janubiy Koreya', '55 daq / qism',
  '4K Ultra HD', '18+', 8, 7.6, 695000,
  true, false, 'Xvan Don Xyok', ARRAY['Li Jon Je', 'Li Byon Xon', 'Vi Xa Jun', 'Kon Yu'],
  'Moliyaviy qiyinchilikka botgan 456 nafar ishtirokchi ulkan pul mukofoti uchun sirli bolalar o''yinlarida qatnashish taklifini qabul qiladi. Biroq mag''lubiyatning narxi — o''lim.', 'https://m.media-amazon.com/images/M/MV5BMDcxYjg1OTctYmUxZi00ZjhjLWIwNTMtNmI2M2Y4OTU1YWU2XkEyXkFqcGc@._V1_FMjpg_UX800_.jpg', 'https://i.ytimg.com/vi/oqxAJKy0ii4/maxresdefault.jpg', 'https://www.youtube.com/watch?v=oqxAJKy0ii4', 'https://www.youtube.com/watch?v=oqxAJKy0ii4',
  '2026-11-05T20:01:00Z', now()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  original_title = EXCLUDED.original_title,
  category = EXCLUDED.category,
  studio = EXCLUDED.studio,
  genres = EXCLUDED.genres,
  year = EXCLUDED.year,
  country = EXCLUDED.country,
  duration = EXCLUDED.duration,
  quality = EXCLUDED.quality,
  age_rating = EXCLUDED.age_rating,
  imdb_rating = EXCLUDED.imdb_rating,
  kp_rating = EXCLUDED.kp_rating,
  views = EXCLUDED.views,
  is_premiere = EXCLUDED.is_premiere,
  is_featured = EXCLUDED.is_featured,
  director = EXCLUDED.director,
  cast_members = EXCLUDED.cast_members,
  description = EXCLUDED.description,
  poster_url = EXCLUDED.poster_url,
  backdrop_url = EXCLUDED.backdrop_url,
  video_url = EXCLUDED.video_url,
  trailer_url = EXCLUDED.trailer_url,
  created_at = EXCLUDED.created_at,
  updated_at = now();

INSERT INTO public.episodes (movie_id, season_number, episode_number, title, duration, video_url)
SELECT id, 1, 1, 'Qizil chiroq, yashil chiroq', '60 daq', 'https://www.youtube.com/watch?v=oqxAJKy0ii4'
FROM public.movies WHERE slug = 'kalmar-oyini-serial'
ON CONFLICT (movie_id, season_number, episode_number) DO UPDATE SET
  title = EXCLUDED.title,
  duration = EXCLUDED.duration,
  video_url = EXCLUDED.video_url;

INSERT INTO public.episodes (movie_id, season_number, episode_number, title, duration, video_url)
SELECT id, 1, 2, 'Do''zax', '63 daq', 'https://www.youtube.com/watch?v=oqxAJKy0ii4'
FROM public.movies WHERE slug = 'kalmar-oyini-serial'
ON CONFLICT (movie_id, season_number, episode_number) DO UPDATE SET
  title = EXCLUDED.title,
  duration = EXCLUDED.duration,
  video_url = EXCLUDED.video_url;

INSERT INTO public.episodes (movie_id, season_number, episode_number, title, duration, video_url)
SELECT id, 2, 1, 'Qaytish va yangi o''yin', '58 daq', 'https://www.youtube.com/watch?v=Ed1sGgHUo88'
FROM public.movies WHERE slug = 'kalmar-oyini-serial'
ON CONFLICT (movie_id, season_number, episode_number) DO UPDATE SET
  title = EXCLUDED.title,
  duration = EXCLUDED.duration,
  video_url = EXCLUDED.video_url;

INSERT INTO public.episodes (movie_id, season_number, episode_number, title, duration, video_url)
SELECT id, 2, 2, 'Ovoz berish kechasi', '61 daq', 'https://www.youtube.com/watch?v=Ed1sGgHUo88'
FROM public.movies WHERE slug = 'kalmar-oyini-serial'
ON CONFLICT (movie_id, season_number, episode_number) DO UPDATE SET
  title = EXCLUDED.title,
  duration = EXCLUDED.duration,
  video_url = EXCLUDED.video_url;
