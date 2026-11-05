"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clapperboard, Flame, Play, Shuffle, Shield, Sparkles, Star, TrendingUp } from "lucide-react";
import MovieCard, { MovieGridSkeleton } from "@/components/MovieCard";
import { useMovies } from "@/lib/movies-context";
import type { Movie } from "@/lib/types";

const STUDIO_CARDS = [
  { name: "Marvel Studios", short: "MARVEL", sub: "MCU Olami", badgeBg: "from-red-600 to-red-900" },
  { name: "DC Studios", short: "DC", sub: "Gotem & Metropol", badgeBg: "from-blue-600 to-slate-900" },
  { name: "20th Century Fox", short: "20th FOX", sub: "Avatar & X-Men", badgeBg: "from-amber-500 to-amber-900" },
  { name: "Warner Bros.", short: "WB", sub: "Nolan & Dyuna", badgeBg: "from-sky-500 to-indigo-950" },
  { name: "Universal Pictures", short: "UNIVERSAL", sub: "Forsaj & Oppengeymer", badgeBg: "from-emerald-600 to-teal-950" },
  { name: "Paramount Pictures", short: "PARAMOUNT", sub: "Top Gan & IMF", badgeBg: "from-cyan-600 to-blue-950" },
  { name: "Sony Pictures", short: "SONY", sub: "Venom & Spider-Verse", badgeBg: "from-purple-600 to-violet-950" },
  { name: "Walt Disney Pictures", short: "DISNEY • PIXAR", sub: "Animatsiya xitlari", badgeBg: "from-pink-600 to-rose-950" },
];

function Section({ title, href, movies, icon }: { title: string; href: string; movies: Movie[]; icon?: React.ReactNode }) {
  if (!movies.length) return null;
  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 border-l-4 border-accent pl-3 text-xl font-bold">
          {icon} {title}
        </h2>
        <Link href={href} className="text-sm text-muted hover:text-accent">
          Barchasi ({movies.length}) →
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
    <div className="relative h-[360px] overflow-hidden rounded-2xl border border-line sm:h-[460px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={m.id}
        src={m.backdrop}
        alt={m.title}
        onError={(e) => {
          if (m.poster && e.currentTarget.src !== m.poster) e.currentTarget.src = m.poster;
        }}
        className="absolute inset-0 h-full w-full animate-fade-in object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/85 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent" />
      <div key={m.id + "t"} className="relative flex h-full max-w-xl animate-fade-in flex-col justify-end p-6 sm:p-10">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
          {m.studio && (
            <Link
              href={`/kinolar?studio=${encodeURIComponent(m.studio)}`}
              className="rounded border border-white/25 bg-black/70 px-2.5 py-0.5 font-extrabold uppercase tracking-wider text-white hover:border-accent"
            >
              {m.studio}
            </Link>
          )}
          {m.isPremiere && <span className="rounded bg-gold px-2 py-0.5 font-bold text-black">PREMYERA</span>}
          <span className="rounded bg-accent px-2 py-0.5 font-bold text-white">{m.quality}</span>
          <span className="flex items-center gap-1 text-gold">
            <Star className="h-3.5 w-3.5 fill-gold" /> IMDb {m.imdb.toFixed(1)}
          </span>
          <span className="text-muted">
            {m.year} • {m.country} • {m.ageRating}
          </span>
        </div>
        <h1 className="text-3xl font-extrabold leading-tight sm:text-5xl">{m.title}</h1>
        <p className="mt-1 text-sm text-muted">{m.originalTitle} • O&apos;zbek tilida</p>
        <p className="mt-3 line-clamp-3 text-sm text-gray-300 sm:text-base">{m.description}</p>
        <div className="mt-5 flex flex-wrap gap-3">
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
            className="absolute right-16 bottom-6 grid h-10 w-10 place-items-center rounded-full border border-line bg-black/60 hover:bg-accent"
            aria-label="Oldingi"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setI((v) => (v + 1) % items.length)}
            className="absolute right-4 bottom-6 grid h-10 w-10 place-items-center rounded-full border border-line bg-black/60 hover:bg-accent"
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
      featured: featured.length ? featured : movies.slice(0, 6),
      premieres: movies.filter((m) => m.isPremiere),
      popular: [...movies].sort((a, b) => b.views - a.views),
      marvel: movies.filter((m) => m.studio === "Marvel Studios"),
      dc: movies.filter((m) => m.studio === "DC Studios"),
      wbFox: movies.filter((m) => m.studio === "Warner Bros." || m.studio === "20th Century Fox"),
      tarjima: movies.filter((m) => m.category === "tarjima"),
      serial: movies.filter((m) => m.category === "serial"),
      multfilm: movies.filter((m) => m.category === "multfilm"),
    };
  }, [movies]);

  if (loading) {
    return (
      <>
        <div className="mb-8 h-[360px] animate-pulse rounded-2xl bg-panel sm:h-[460px]" />
        <MovieGridSkeleton />
      </>
    );
  }

  if (error) return <p className="rounded-xl border border-accent/40 bg-accent/10 p-4 text-sm">Xatolik: {error}</p>;

  return (
    <>
      <Hero items={data.featured} />

      {/* Kino studiyalar tezkor bo'limi */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 border-l-4 border-accent pl-3 text-lg font-bold">
            <Clapperboard className="h-5 w-5 text-accent" /> Jahon kino studiyalari
          </h2>
          <Link href="/kinolar" className="text-xs text-muted hover:text-accent">
            Barcha {movies.length} ta kino →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {STUDIO_CARDS.map((st) => (
            <Link
              key={st.name}
              href={`/kinolar?studio=${encodeURIComponent(st.name)}`}
              className={`group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br ${st.badgeBg} p-3.5 text-center shadow-lg transition duration-300 hover:-translate-y-1 hover:border-white/40`}
            >
              <div className="text-xs font-black tracking-wider text-white drop-shadow">{st.short}</div>
              <div className="mt-1 text-[10px] font-medium text-white/75">{st.sub}</div>
            </Link>
          ))}
        </div>
      </section>

      <Section title="Premyeralar" href="/kinolar?premyera=1" movies={data.premieres} icon={<Flame className="h-5 w-5 text-accent" />} />
      <Section title="Marvel Studios olami" href="/kinolar?studio=Marvel%20Studios" movies={data.marvel} icon={<Sparkles className="h-5 w-5 text-accent" />} />
      <Section title="DC Studios blokbasterlari" href="/kinolar?studio=DC%20Studios" movies={data.dc} icon={<Shield className="h-5 w-5 text-accent" />} />
      <Section title="Warner Bros. va 20th Century Fox shedevrlari" href="/kinolar?studio=Warner%20Bros." movies={data.wbFox} />
      <Section title="Eng ko'p ko'rilganlar" href="/kinolar?sort=views" movies={data.popular} icon={<TrendingUp className="h-5 w-5 text-accent" />} />
      <Section title="Tarjima kinolar" href="/kinolar?cat=tarjima" movies={data.tarjima} />
      <Section title="Seriallar" href="/kinolar?cat=serial" movies={data.serial} />
      <Section title="Multfilmlar" href="/kinolar?cat=multfilm" movies={data.multfilm} />
    </>
  );
}
