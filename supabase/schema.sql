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


-- Boshlang'ich 12 ta kinoni kiritish (Seed)
INSERT INTO public.movies (slug, title, original_title, category, genres, year, country, duration, quality, age_rating, imdb_rating, kp_rating, views, is_premiere, is_featured, director, cast_members, description, poster_url, backdrop_url, video_url, trailer_url)
VALUES ('katta-quyon-bak', 'Katta quyon Bak', 'Big Buck Bunny', 'multfilm', ARRAY['Komediya','Oilaviy','Sarguzasht'], 2008, 'Niderlandiya', '10 daq', '1080p Full HD', '0+', 6.4, 7.1, 48210, false, true, 'Sacha Goedegebure', ARRAY['Bak','Frenk','Rinki','Gimera'], 'O''rmondagi mehribon ulkan quyon Bak tinch hayot kechiradi. Ammo uch nafar shumtaka kemiruvchi uning kichik do''stlarini xafa qilishganda, Bak ularga unutilmas saboq berishga qaror qiladi.', 'https://picsum.photos/seed/bigbuck/400/600', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'https://www.youtube.com/embed/aqz-KE-bpKQ') ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.movies (slug, title, original_title, category, genres, year, country, duration, quality, age_rating, imdb_rating, kp_rating, views, is_premiere, is_featured, director, cast_members, description, poster_url, backdrop_url, video_url, trailer_url)
VALUES ('sintel', 'Sintel: Ajdar izidan', 'Sintel', 'tarjima', ARRAY['Fentezi','Sarguzasht','Drama'], 2010, 'Niderlandiya', '15 daq', '1080p Full HD', '12+', 7.4, 7.6, 73502, true, true, 'Colin Levy', ARRAY['Halina Reijn','Thom Hoffman'], 'Yolg''iz sayohatchi qiz Sintel yaralangan kichkina ajdarchani topib, uni boqib oladi. Bir kun ajdarcha g''oyib bo''ladi va Sintel uni izlab xavfli va uzoq safarga otlanadi.', 'https://picsum.photos/seed/sintel/400/600', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/Sintel.jpg', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', 'https://www.youtube.com/embed/eRsGyueVLvQ') ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.movies (slug, title, original_title, category, genres, year, country, duration, quality, age_rating, imdb_rating, kp_rating, views, is_premiere, is_featured, director, cast_members, description, poster_url, backdrop_url, video_url, trailer_url)
VALUES ('pulat-koz-yoshlari', 'Po''lat ko''z yoshlari', 'Tears of Steel', 'tarjima', ARRAY['Fantastika','Jangari'], 2012, 'Niderlandiya', '12 daq', '1080p Full HD', '16+', 6.1, 6.5, 39877, true, true, 'Ian Hubert', ARRAY['Derek de Lint','Sergio Hasselbaink','Rogier Schippers'], 'Kelajakdagi Amsterdam. Bir guruh olimlar va jangchilar dunyoni robotlar bosqinidan qutqarish uchun o''tmishdagi og''riqli xotiraga qaytishlari kerak.', 'https://picsum.photos/seed/tearsofsteel/400/600', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/TearsOfSteel.jpg', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', 'https://www.youtube.com/embed/R6MlUcmOul8') ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.movies (slug, title, original_title, category, genres, year, country, duration, quality, age_rating, imdb_rating, kp_rating, views, is_premiere, is_featured, director, cast_members, description, poster_url, backdrop_url, video_url, trailer_url)
VALUES ('fil-tushi', 'Fil tushi', 'Elephants Dream', 'tarjima', ARRAY['Fantastika','Triller'], 2006, 'Niderlandiya', '11 daq', '720p HD', '12+', 6, 6.2, 21004, false, false, 'Bassam Kurdali', ARRAY['Tygo Gernandt','Cas Jansen'], 'Ikki qahramon — keksa Proog va yosh Emo — cheksiz mexanik olam ichida adashib yurishadi. Haqiqat va xayol orasidagi chegara asta-sekin yo''qoladi.', 'https://picsum.photos/seed/elephantsdream/400/600', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 'https://www.youtube.com/embed/TLkA0RELQ1g') ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.movies (slug, title, original_title, category, genres, year, country, duration, quality, age_rating, imdb_rating, kp_rating, views, is_premiere, is_featured, director, cast_members, description, poster_url, backdrop_url, video_url, trailer_url)
VALUES ('olov-yoli', 'Olov yo''li', 'Road of Fire', 'tarjima', ARRAY['Jangari','Kriminal','Triller'], 2025, 'AQSH', '1 s 52 daq', '1080p Full HD', '18+', 7.2, 7, 125430, true, false, 'Demo Rejissyor', ARRAY['Aktyor 1','Aktyor 2','Aktyor 3'], 'Sobiq politsiyachi o''z shahrini qo''rquvda ushlab turgan jinoiy guruhga qarshi yolg''iz kurashga chiqadi. Har bir qadam uni haqiqatga va xavfga yaqinlashtiradi.', 'https://picsum.photos/seed/olovyoli/400/600', 'https://picsum.photos/seed/olovyoli-bg/1280/720', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4') ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.movies (slug, title, original_title, category, genres, year, country, duration, quality, age_rating, imdb_rating, kp_rating, views, is_premiere, is_featured, director, cast_members, description, poster_url, backdrop_url, video_url, trailer_url)
VALUES ('qochish', 'Qochish', 'The Escape', 'tarjima', ARRAY['Sarguzasht','Triller'], 2024, 'Buyuk Britaniya', '1 s 41 daq', '1080p Full HD', '16+', 6.8, 6.9, 64220, false, false, 'Demo Rejissyor', ARRAY['Aktyor 1','Aktyor 2'], 'Do''stlar guruhi tog''li hududda adashib qoladi. Omon qolish uchun ular bir-biriga ishonishni va qo''rquvlarini yengishni o''rganishlari kerak.', 'https://picsum.photos/seed/qochish/400/600', 'https://picsum.photos/seed/qochish-bg/1280/720', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4') ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.movies (slug, title, original_title, category, genres, year, country, duration, quality, age_rating, imdb_rating, kp_rating, views, is_premiere, is_featured, director, cast_members, description, poster_url, backdrop_url, video_url, trailer_url)
VALUES ('kulgili-oila', 'Kulgili oila', 'Funny Family', 'tarjima', ARRAY['Komediya','Oilaviy'], 2023, 'Fransiya', '1 s 35 daq', '720p HD', '6+', 6.5, 6.8, 33010, false, false, 'Demo Rejissyor', ARRAY['Aktyor 1','Aktyor 2'], 'Katta oila bayram uchun bir uyga yig''iladi. Kutilmagan mehmonlar va kulgili tushunmovchiliklar bayramni unutilmas sarguzashtga aylantiradi.', 'https://picsum.photos/seed/kulgilioila/400/600', 'https://picsum.photos/seed/kulgilioila-bg/1280/720', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4') ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.movies (slug, title, original_title, category, genres, year, country, duration, quality, age_rating, imdb_rating, kp_rating, views, is_premiere, is_featured, director, cast_members, description, poster_url, backdrop_url, video_url, trailer_url)
VALUES ('tungi-shahar-sirlari', 'Tungi shahar sirlari', 'Night City Secrets', 'serial', ARRAY['Detektiv','Kriminal','Drama'], 2025, 'Janubiy Koreya', '45 daq / qism', '1080p Full HD', '16+', 8.1, 7.9, 210340, true, true, 'Demo Rejissyor', ARRAY['Aktyor 1','Aktyor 2','Aktyor 3'], 'Yosh tergovchi shahar bo''ylab sodir bo''layotgan sirli voqealarni tekshiradi. Har bir qismda yangi jumboq ochiladi, ammo asosiy savol javobsiz qolmoqda.', 'https://picsum.photos/seed/tungishahar/400/600', 'https://picsum.photos/seed/tungishahar-bg/1280/720', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4') ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.movies (slug, title, original_title, category, genres, year, country, duration, quality, age_rating, imdb_rating, kp_rating, views, is_premiere, is_featured, director, cast_members, description, poster_url, backdrop_url, video_url, trailer_url)
VALUES ('yollar-va-taqdirlar', 'Yo''llar va taqdirlar', 'Yollar ve Kaderler', 'serial', ARRAY['Melodrama','Drama'], 2024, 'Turkiya', '2 s / qism', '720p HD', '12+', 7, 7.2, 180900, false, false, 'Demo Rejissyor', ARRAY['Aktyor 1','Aktyor 2'], 'Ikki oilaning taqdiri kutilmaganda kesishadi. Sevgi, sadoqat va eski sirlar haqidagi ta''sirli turk seriali o''zbek tilida.', 'https://picsum.photos/seed/yollartaqdir/400/600', 'https://picsum.photos/seed/yollartaqdir-bg/1280/720', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4', '') ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.movies (slug, title, original_title, category, genres, year, country, duration, quality, age_rating, imdb_rating, kp_rating, views, is_premiere, is_featured, director, cast_members, description, poster_url, backdrop_url, video_url, trailer_url)
VALUES ('tezlik-qiroli', 'Tezlik qiroli', 'King of Speed', 'tarjima', ARRAY['Jangari','Sarguzasht'], 2026, 'AQSH', '2 s 05 daq', '1080p Full HD', '16+', 7.6, 7.3, 98760, true, false, 'Demo Rejissyor', ARRAY['Aktyor 1','Aktyor 2'], 'Ko''cha poygachisi butun hayotini o''zgartirishi mumkin bo''lgan so''nggi poygaga chiqadi. Lekin g''alaba narxi juda baland bo''lishi mumkin.', 'https://picsum.photos/seed/tezlikqiroli/400/600', 'https://picsum.photos/seed/tezlikqiroli-bg/1280/720', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4') ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.movies (slug, title, original_title, category, genres, year, country, duration, quality, age_rating, imdb_rating, kp_rating, views, is_premiere, is_featured, director, cast_members, description, poster_url, backdrop_url, video_url, trailer_url)
VALUES ('sehrli-orman', 'Sehrli o''rmon', 'Magic Forest', 'multfilm', ARRAY['Fentezi','Oilaviy','Komediya'], 2025, 'Yaponiya', '1 s 28 daq', '1080p Full HD', '0+', 7.8, 8, 56430, true, false, 'Demo Rejissyor', ARRAY['Ovoz 1','Ovoz 2'], 'Kichkina qizcha bobosining bog''ida sehrli o''rmonga olib boruvchi eshikni topadi. U yerda uni ajoyib mavjudotlar va katta sinovlar kutmoqda.', 'https://picsum.photos/seed/sehrliorman/400/600', 'https://picsum.photos/seed/sehrliorman-bg/1280/720', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4') ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.movies (slug, title, original_title, category, genres, year, country, duration, quality, age_rating, imdb_rating, kp_rating, views, is_premiere, is_featured, director, cast_members, description, poster_url, backdrop_url, video_url, trailer_url)
VALUES ('qadimiy-saltanat', 'Qadimiy saltanat', 'Ancient Empire', 'tarjima', ARRAY['Tarixiy','Drama','Jangari'], 2022, 'Hindiston', '2 s 40 daq', '1080p Full HD', '16+', 7.9, 7.7, 143200, false, false, 'Demo Rejissyor', ARRAY['Aktyor 1','Aktyor 2','Aktyor 3'], 'Buyuk saltanat taxti uchun aka-ukalar o''rtasidagi kurash. Sadoqat, xiyonat va qahramonlik haqida epik hikoya.', 'https://picsum.photos/seed/qadimiysaltanat/400/600', 'https://picsum.photos/seed/qadimiysaltanat-bg/1280/720', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4', '') ON CONFLICT (slug) DO NOTHING;

-- Seriallar qismlarini kiritish
INSERT INTO public.episodes (movie_id, season_number, episode_number, title, duration, video_url)
SELECT id, 1, 1, 'Birinchi iz', '45 daq', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4' FROM public.movies WHERE slug = 'tungi-shahar-sirlari'
ON CONFLICT (movie_id, season_number, episode_number) DO NOTHING;
INSERT INTO public.episodes (movie_id, season_number, episode_number, title, duration, video_url)
SELECT id, 1, 2, 'Yashirin xona', '47 daq', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4' FROM public.movies WHERE slug = 'tungi-shahar-sirlari'
ON CONFLICT (movie_id, season_number, episode_number) DO NOTHING;
INSERT INTO public.episodes (movie_id, season_number, episode_number, title, duration, video_url)
SELECT id, 1, 3, 'Soxta guvoh', '44 daq', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' FROM public.movies WHERE slug = 'tungi-shahar-sirlari'
ON CONFLICT (movie_id, season_number, episode_number) DO NOTHING;
INSERT INTO public.episodes (movie_id, season_number, episode_number, title, duration, video_url)
SELECT id, 1, 4, 'Yakuniy dalil', '50 daq', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4' FROM public.movies WHERE slug = 'tungi-shahar-sirlari'
ON CONFLICT (movie_id, season_number, episode_number) DO NOTHING;
INSERT INTO public.episodes (movie_id, season_number, episode_number, title, duration, video_url)
SELECT id, 1, 1, '1-qism', '2 s', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4' FROM public.movies WHERE slug = 'yollar-va-taqdirlar'
ON CONFLICT (movie_id, season_number, episode_number) DO NOTHING;
INSERT INTO public.episodes (movie_id, season_number, episode_number, title, duration, video_url)
SELECT id, 1, 2, '2-qism', '2 s', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4' FROM public.movies WHERE slug = 'yollar-va-taqdirlar'
ON CONFLICT (movie_id, season_number, episode_number) DO NOTHING;
INSERT INTO public.episodes (movie_id, season_number, episode_number, title, duration, video_url)
SELECT id, 1, 3, '3-qism', '2 s', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4' FROM public.movies WHERE slug = 'yollar-va-taqdirlar'
ON CONFLICT (movie_id, season_number, episode_number) DO NOTHING;
