"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, Clock, Download, Eye, Film, Globe, Play, Shuffle, Star, X } from "lucide-react";
import VideoPlayer from "@/components/VideoPlayer";
import MovieCard from "@/components/MovieCard";
import { useMovies } from "@/lib/movies-context";
import { formatViews, incrementViews } from "@/lib/store";
import { CATEGORY_LABELS } from "@/lib/types";

const QUALITIES = [
  { label: "1080p Full HD", size: "≈ 2.1 GB" },
  { label: "720p HD", size: "≈ 1.1 GB" },
  { label: "480p", size: "≈ 560 MB" },
];

export default function MoviePage() {
  const { slug } = useParams<{ slug: string }>();
  const { movies, loading } = useMovies();
  const movie = movies.find((m) => m.slug === decodeURIComponent(slug));
  const [epIndex, setEpIndex] = useState(0);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const counted = useRef<string | null>(null);

  useEffect(() => {
    if (movie && counted.current !== movie.id) {
      counted.current = movie.id;
      incrementViews(movie);
      setEpIndex(0);
    }
  }, [movie]);

  const similar = useMemo(() => {
    if (!movie) return [];
    return movies
      .filter((m) => m.id !== movie.id)
      .map((m) => ({ m, score: m.genres.filter((g) => movie.genres.includes(g)).length + (m.category === movie.category ? 1 : 0) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((x) => x.m);
  }, [movies, movie]);

  if (loading) return <div className="h-[60vh] animate-pulse rounded-2xl bg-panel" />;

  if (!movie) {
    return (
      <div className="grid place-items-center py-24 text-center">
        <Film className="mb-4 h-12 w-12 text-muted" />
        <h1 className="text-2xl font-bold">Kino topilmadi</h1>
        <p className="mt-2 text-muted">Ushbu kino o&apos;chirilgan yoki manzil noto&apos;g&apos;ri.</p>
        <Link href="/" className="btn btn-primary mt-6">
          Bosh sahifaga qaytish
        </Link>
      </div>
    );
  }

  const episode = movie.episodes[epIndex];
  const currentSrc = episode?.videoUrl ?? movie.videoUrl;
  const info: [string, React.ReactNode][] = [
    ["Turi", <Link key="c" className="text-accent hover:underline" href={`/kinolar?cat=${movie.category}`}>{CATEGORY_LABELS[movie.category]}</Link>],
    ["Original nomi", movie.originalTitle || "—"],
    ["Yili", <Link key="y" className="hover:text-accent" href={`/kinolar?year=${movie.year}`}>{movie.year}</Link>],
    ["Davlati", <Link key="co" className="hover:text-accent" href={`/kinolar?country=${encodeURIComponent(movie.country)}`}>{movie.country}</Link>],
    [
      "Janri",
      <span key="g" className="flex flex-wrap gap-x-1">
        {movie.genres.map((g, i) => (
          <Link key={g} className="hover:text-accent" href={`/kinolar?genre=${encodeURIComponent(g)}`}>
            {g}
            {i < movie.genres.length - 1 ? "," : ""}
          </Link>
        ))}
      </span>,
    ],
    ["Davomiyligi", movie.duration],
    ["Sifati", movie.quality],
    ["Yosh chegarasi", movie.ageRating],
    ["Rejissyor", movie.director || "—"],
    ["Rollarda", movie.cast.join(", ") || "—"],
    ["Tarjima", "O'zbek tilida (professional dublyaj)"],
  ];

  return (
    <div className="animate-fade-in">
      {/* Fon */}
      <div className="relative -mx-3 -mt-5 mb-6 overflow-hidden sm:-mx-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={movie.backdrop} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-25 blur-sm" />
        <div className="absolute inset-0 bg-gradient-to-b from-bg/40 via-bg/80 to-bg" />

        <div className="relative grid gap-6 px-3 pb-4 pt-6 sm:px-5 md:grid-cols-[260px_1fr]">
          <div className="mx-auto w-52 md:w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={movie.poster} alt={movie.title} className="aspect-[2/3] w-full rounded-xl border border-line object-cover shadow-2xl" />
            <div className="mt-3 grid grid-cols-2 gap-2 text-center text-sm">
              <div className="rounded-lg border border-line bg-panel p-2">
                <div className="text-xs text-muted">IMDb</div>
                <div className="flex items-center justify-center gap-1 font-bold text-gold">
                  <Star className="h-4 w-4 fill-gold" /> {movie.imdb.toFixed(1)}
                </div>
              </div>
              <div className="rounded-lg border border-line bg-panel p-2">
                <div className="text-xs text-muted">Kinopoisk</div>
                <div className="font-bold text-orange-400">{movie.kp.toFixed(1)}</div>
              </div>
            </div>
          </div>

          <div>
            <nav className="mb-2 text-xs text-muted">
              <Link href="/" className="hover:text-accent">Bosh sahifa</Link> /{" "}
              <Link href={`/kinolar?cat=${movie.category}`} className="hover:text-accent">{CATEGORY_LABELS[movie.category]}</Link> / {movie.title}
            </nav>
            <h1 className="text-2xl font-extrabold sm:text-4xl">
              {movie.title} <span className="text-lg font-medium text-muted">({movie.year})</span>
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted">
              <span className="rounded bg-accent px-2 py-0.5 text-xs font-bold text-white">{movie.quality}</span>
              {movie.isPremiere && <span className="rounded bg-gold px-2 py-0.5 text-xs font-bold text-black">PREMYERA</span>}
              <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {movie.year}</span>
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {movie.duration}</span>
              <span className="flex items-center gap-1"><Globe className="h-4 w-4" /> {movie.country}</span>
              <span className="flex items-center gap-1"><Eye className="h-4 w-4" /> {formatViews(movie.views)}</span>
            </div>

            <dl className="mt-5 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              {info.map(([k, v]) => (
                <div key={k} className="flex gap-2 border-b border-line/60 pb-2">
                  <dt className="w-32 shrink-0 text-muted">{k}:</dt>
                  <dd className="min-w-0">{v}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-5 flex flex-wrap gap-3">
              <a href="#player" className="btn btn-primary">
                <Play className="h-4 w-4 fill-white" /> Onlayn ko&apos;rish
              </a>
              {movie.trailerUrl && (
                <button className="btn btn-ghost" onClick={() => setTrailerOpen(true)}>
                  <Film className="h-4 w-4" /> Treyler
                </button>
              )}
              <a href="#download" className="btn btn-ghost">
                <Download className="h-4 w-4" /> Yuklab olish
              </a>
              <Link href="/random" className="btn btn-ghost">
                <Shuffle className="h-4 w-4" /> Tasodifiy
              </Link>
            </div>
          </div>
        </div>
      </div>

      <section className="rounded-xl border border-line bg-panel p-5">
        <h2 className="mb-2 text-lg font-bold">Kino haqida</h2>
        <p className="leading-relaxed text-gray-300">{movie.description}</p>
      </section>

      {/* Pleer */}
      <section id="player" className="mt-6 scroll-mt-20 rounded-xl border border-line bg-panel p-3 sm:p-5">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
          <Play className="h-5 w-5 text-accent" /> {movie.title} — onlayn tomosha qilish
          {episode && <span className="text-sm font-normal text-muted">({episode.season}-fasl, {episode.episode}-qism)</span>}
        </h2>
        <VideoPlayer src={currentSrc} poster={movie.backdrop} fallbackUrl={movie.trailerUrl} />

        {movie.episodes.length > 0 && (
          <div className="mt-4">
            <h3 className="mb-2 text-sm font-semibold text-muted">Qismlar:</h3>
            <div className="flex flex-wrap gap-2">
              {movie.episodes.map((e, i) => (
                <button
                  key={e.id}
                  onClick={() => setEpIndex(i)}
                  title={`${e.title} • ${e.duration}`}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                    i === epIndex ? "border-accent bg-accent text-white" : "border-line bg-panel-2 hover:border-accent"
                  }`}
                >
                  {e.season > 1 ? `${e.season}-f ` : ""}
                  {e.episode}-qism
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Yuklab olish */}
      <section id="download" className="mt-6 scroll-mt-20 rounded-xl border border-line bg-panel p-5">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
          <Download className="h-5 w-5 text-accent" /> Yuklab olish {episode && `(${episode.episode}-qism)`}
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {QUALITIES.map((q) => (
            <a
              key={q.label}
              href={currentSrc}
              download
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-lg border border-line bg-panel-2 px-4 py-3 transition hover:border-accent"
            >
              <span>
                <span className="block font-semibold">{q.label}</span>
                <span className="text-xs text-muted">MP4 • {q.size}</span>
              </span>
              <Download className="h-5 w-5 text-accent" />
            </a>
          ))}
        </div>
      </section>

      {similar.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 border-l-4 border-accent pl-3 text-xl font-bold">O&apos;xshash kinolar</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {similar.map((m) => (
              <MovieCard key={m.id} movie={m} />
            ))}
          </div>
        </section>
      )}

      {trailerOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/85 p-4" onClick={() => setTrailerOpen(false)}>
          <div className="w-full max-w-4xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-bold">{movie.title} — rasmiy treyler</h3>
              <button onClick={() => setTrailerOpen(false)} className="rounded-full p-1 hover:bg-white/10" aria-label="Yopish">
                <X className="h-6 w-6" />
              </button>
            </div>
            <VideoPlayer src={movie.trailerUrl} autoPlay />
          </div>
        </div>
      )}
    </div>
  );
}
