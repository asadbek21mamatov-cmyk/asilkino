"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Flame, Play, Shuffle, Star, TrendingUp } from "lucide-react";
import MovieCard, { MovieGridSkeleton } from "@/components/MovieCard";
import { useMovies } from "@/lib/movies-context";
import type { Movie } from "@/lib/types";

function Section({ title, href, movies, icon }: { title: string; href: string; movies: Movie[]; icon?: React.ReactNode }) {
  if (!movies.length) return null;
  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 border-l-4 border-accent pl-3 text-xl font-bold">
          {icon} {title}
        </h2>
        <Link href={href} className="text-sm text-muted hover:text-accent">
          Barchasi →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {movies.slice(0, 6).map((m) => (
          <MovieCard key={m.id} movie={m} />
        ))}
      </div>
    </section>
  );
}

function Hero({ items }: { items: Movie[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => setI((v) => (v + 1) % items.length), 6000);
    return () => clearInterval(t);
  }, [items.length]);
  if (!items.length) return null;
  const m = items[i % items.length];

  return (
    <div className="relative h-[340px] overflow-hidden rounded-2xl border border-line sm:h-[440px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img key={m.id} src={m.backdrop} alt={m.title} className="absolute inset-0 h-full w-full animate-fade-in object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/80 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent" />
      <div key={m.id + "t"} className="relative flex h-full max-w-xl animate-fade-in flex-col justify-end p-6 sm:p-10">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
          {m.isPremiere && <span className="rounded bg-gold px-2 py-0.5 font-bold text-black">PREMYERA</span>}
          <span className="rounded bg-accent px-2 py-0.5 font-bold">{m.quality}</span>
          <span className="flex items-center gap-1 text-gold">
            <Star className="h-3.5 w-3.5 fill-gold" /> IMDb {m.imdb.toFixed(1)}
          </span>
          <span className="text-muted">
            {m.year} • {m.country} • {m.ageRating}
          </span>
        </div>
        <h1 className="text-3xl font-extrabold leading-tight sm:text-5xl">{m.title}</h1>
        <p className="mt-1 text-sm text-muted">{m.originalTitle}</p>
        <p className="mt-3 line-clamp-3 text-sm text-gray-300 sm:text-base">{m.description}</p>
        <div className="mt-5 flex gap-3">
          <Link href={`/kino/${m.slug}`} className="btn btn-primary">
            <Play className="h-4 w-4 fill-white" /> Tomosha qilish
          </Link>
          <Link href="/random" className="btn btn-ghost">
            <Shuffle className="h-4 w-4" /> Tasodifiy kino
          </Link>
        </div>
      </div>
      {items.length > 1 && (
        <>
          <button
            onClick={() => setI((v) => (v - 1 + items.length) % items.length)}
            className="absolute right-16 bottom-6 grid h-10 w-10 place-items-center rounded-full border border-line bg-black/50 hover:bg-accent"
            aria-label="Oldingi"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setI((v) => (v + 1) % items.length)}
            className="absolute right-4 bottom-6 grid h-10 w-10 place-items-center rounded-full border border-line bg-black/50 hover:bg-accent"
            aria-label="Keyingi"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {items.map((_, k) => (
              <span key={k} className={`h-1.5 rounded-full transition-all ${k === i % items.length ? "w-6 bg-accent" : "w-1.5 bg-white/40"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function HomePage() {
  const { movies, loading, error } = useMovies();

  const data = useMemo(() => {
    const featured = movies.filter((m) => m.isFeatured);
    return {
      featured: featured.length ? featured : movies.slice(0, 5),
      latest: [...movies].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      premieres: movies.filter((m) => m.isPremiere),
      popular: [...movies].sort((a, b) => b.views - a.views),
      tarjima: movies.filter((m) => m.category === "tarjima"),
      serial: movies.filter((m) => m.category === "serial"),
      multfilm: movies.filter((m) => m.category === "multfilm"),
    };
  }, [movies]);

  if (loading) {
    return (
      <>
        <div className="mb-8 h-[340px] animate-pulse rounded-2xl bg-panel sm:h-[440px]" />
        <MovieGridSkeleton />
      </>
    );
  }

  if (error) return <p className="rounded-xl border border-accent/40 bg-accent/10 p-4 text-sm">Xatolik: {error}</p>;

  return (
    <>
      <Hero items={data.featured} />
      <Section title="Yangi qo'shilganlar" href="/kinolar?sort=new" movies={data.latest} />
      <Section title="Premyeralar" href="/kinolar?premyera=1" movies={data.premieres} icon={<Flame className="h-5 w-5 text-accent" />} />
      <Section title="Eng ko'p ko'rilganlar" href="/kinolar?sort=views" movies={data.popular} icon={<TrendingUp className="h-5 w-5 text-accent" />} />
      <Section title="Tarjima kinolar" href="/kinolar?cat=tarjima" movies={data.tarjima} />
      <Section title="Seriallar" href="/kinolar?cat=serial" movies={data.serial} />
      <Section title="Multfilmlar" href="/kinolar?cat=multfilm" movies={data.multfilm} />
    </>
  );
}
