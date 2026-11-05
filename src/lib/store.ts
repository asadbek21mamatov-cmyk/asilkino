import { DEMO_MOVIES } from "./demo-data";
import { supabase } from "./supabase";
import type { Category, Episode, Movie } from "./types";

const STORAGE_KEY = "asilkino_movies_v1";

/* ---------- Supabase qatorlarini Movie turiga o'girish ---------- */
/* eslint-disable @typescript-eslint/no-explicit-any */
function fromRow(r: any): Movie {
  return {
    id: String(r.id),
    slug: r.slug,
    title: r.title,
    originalTitle: r.original_title ?? "",
    category: r.category as Category,
    genres: r.genres ?? [],
    studio: r.studio ?? "Boshqa",
    year: r.year,
    country: r.country,
    duration: r.duration,
    quality: r.quality,
    ageRating: r.age_rating,
    imdb: Number(r.imdb_rating),
    kp: Number(r.kp_rating),
    views: r.views ?? 0,
    isPremiere: r.is_premiere,
    isFeatured: r.is_featured,
    director: r.director ?? "",
    cast: r.cast_members ?? [],
    description: r.description,
    poster: r.poster_url,
    backdrop: r.backdrop_url,
    videoUrl: r.video_url,
    trailerUrl: r.trailer_url ?? "",
    episodes: ((r.episodes ?? []) as any[])
      .map(
        (e): Episode => ({
          id: String(e.id),
          season: e.season_number,
          episode: e.episode_number,
          title: e.title,
          duration: e.duration,
          videoUrl: e.video_url,
        }),
      )
      .sort((a, b) => a.season - b.season || a.episode - b.episode),
    createdAt: r.created_at,
  };
}

function toRow(m: Movie) {
  return {
    slug: m.slug,
    title: m.title,
    original_title: m.originalTitle,
    category: m.category,
    genres: m.genres,
    studio: m.studio || "Boshqa",
    year: m.year,
    country: m.country,
    duration: m.duration,
    quality: m.quality,
    age_rating: m.ageRating,
    imdb_rating: m.imdb,
    kp_rating: m.kp,
    is_premiere: m.isPremiere,
    is_featured: m.isFeatured,
    director: m.director,
    cast_members: m.cast,
    description: m.description,
    poster_url: m.poster,
    backdrop_url: m.backdrop,
    video_url: m.videoUrl,
    trailer_url: m.trailerUrl,
    updated_at: new Date().toISOString(),
  };
}

/* ---------- LocalStorage (demo rejim) ---------- */
function loadLocal(): Movie[] {
  if (typeof window === "undefined") return DEMO_MOVIES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Movie[];
  } catch {
    /* buzilgan ma'lumot — demo bilan qayta boshlaymiz */
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_MOVIES));
  return DEMO_MOVIES;
}

function saveLocal(movies: Movie[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(movies));
}

export function resetLocalDemo() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_MOVIES));
}

/* ---------- Umumiy API ---------- */
export async function fetchMovies(): Promise<Movie[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from("movies")
      .select("*, episodes(*)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(fromRow);
  }
  return loadLocal();
}

export async function saveMovie(movie: Movie): Promise<void> {
  if (supabase) {
    const isNew = !movie.id || Number.isNaN(Number(movie.id));
    let movieId: number;
    if (isNew) {
      const { data, error } = await supabase.from("movies").insert(toRow(movie)).select("id").single();
      if (error) throw error;
      movieId = data.id;
    } else {
      movieId = Number(movie.id);
      const { error } = await supabase.from("movies").update(toRow(movie)).eq("id", movieId);
      if (error) throw error;
      const del = await supabase.from("episodes").delete().eq("movie_id", movieId);
      if (del.error) throw del.error;
    }
    if (movie.episodes.length) {
      const { error } = await supabase.from("episodes").insert(
        movie.episodes.map((e) => ({
          movie_id: movieId,
          season_number: e.season,
          episode_number: e.episode,
          title: e.title,
          duration: e.duration,
          video_url: e.videoUrl,
        })),
      );
      if (error) throw error;
    }
    return;
  }
  const list = loadLocal();
  const idx = list.findIndex((m) => m.id === movie.id);
  if (idx >= 0) list[idx] = movie;
  else list.unshift({ ...movie, id: movie.id || String(Date.now()) });
  saveLocal(list);
}

export async function deleteMovie(id: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from("movies").delete().eq("id", Number(id));
    if (error) throw error;
    return;
  }
  saveLocal(loadLocal().filter((m) => m.id !== id));
}

export async function incrementViews(movie: Movie): Promise<void> {
  if (supabase) return; // Supabase rejimida ko'rishlar sonini server tomonda hisoblash tavsiya etiladi
  const list = loadLocal();
  const m = list.find((x) => x.id === movie.id);
  if (m) {
    m.views += 1;
    saveLocal(list);
  }
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ʻʼ'`‘’]/g, "")
    .replace(/[^a-z0-9а-яё\s-]/gi, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function formatViews(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return String(n);
}
