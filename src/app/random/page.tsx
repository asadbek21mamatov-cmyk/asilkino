"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Dices, Play, Star } from "lucide-react";
import Filters, { EMPTY_FILTERS, matchesFilters, type FilterState } from "@/components/Filters";
import { useMovies } from "@/lib/movies-context";
import { CATEGORY_LABELS, type Movie } from "@/lib/types";

export default function RandomPage() {
  const { movies, loading } = useMovies();
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [minRating, setMinRating] = useState(0);
  const [picked, setPicked] = useState<Movie | null>(null);
  const [rolling, setRolling] = useState(false);
  const [preview, setPreview] = useState<Movie | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pool = useMemo(
    () => movies.filter((m) => matchesFilters(m, filters) && m.imdb >= minRating),
    [movies, filters, minRating],
  );

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const roll = () => {
    if (!pool.length || rolling) return;
    setRolling(true);
    setPicked(null);
    let step = 0;
    const total = 14;
    const tick = () => {
      setPreview(pool[Math.floor(Math.random() * pool.length)]);
      step++;
      if (step < total) {
        timer.current = setTimeout(tick, 60 + step * 15);
      } else {
        const candidates = pool.length > 1 && picked ? pool.filter((m) => m.id !== picked.id) : pool;
        const final = candidates[Math.floor(Math.random() * candidates.length)];
        setPreview(null);
        setPicked(final);
        setRolling(false);
      }
    };
    tick();
  };

  const shown = preview ?? picked;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-accent shadow-xl shadow-accent/30">
          <Dices className="h-8 w-8 text-white" />
        </span>
        <h1 className="mt-4 text-3xl font-extrabold">Tasodifiy kino</h1>
        <p className="mt-2 text-muted">Nima ko&apos;rishni bilmayapsizmi? Filtrlarni tanlang va tugmani bosing — kinoni biz tanlab beramiz!</p>
      </div>

      <div className="mt-6">
        <Filters value={filters} onChange={setFilters} />
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-panel p-3 text-sm">
          <span className="text-muted">Minimal IMDb reyting:</span>
          <input
            type="range"
            min={0}
            max={9}
            step={0.5}
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
            className="flex-1 accent-[#e50914]"
          />
          <span className="flex w-14 items-center gap-1 font-bold text-gold">
            <Star className="h-4 w-4 fill-gold" /> {minRating.toFixed(1)}
          </span>
          <span className="text-muted">Mos kinolar: <b className="text-white">{pool.length}</b></span>
        </div>
      </div>

      <div className="mt-6 text-center">
        <button onClick={roll} disabled={loading || !pool.length || rolling} className="btn btn-primary !px-8 !py-3.5 text-base disabled:cursor-not-allowed disabled:opacity-50">
          <Dices className={`h-5 w-5 ${rolling ? "animate-spin" : ""}`} />
          {rolling ? "Tanlanmoqda..." : picked ? "Boshqasini tanlash" : "Tasodifiy kino tanlash"}
        </button>
        {!loading && !pool.length && <p className="mt-3 text-sm text-accent">Bu filtrlarga mos kino topilmadi.</p>}
      </div>

      {shown && (
        <div key={shown.id + (rolling ? "r" : "f")} className={`mt-8 overflow-hidden rounded-2xl border border-line bg-panel ${rolling ? "" : "animate-spin-pop"}`}>
          <div className="grid gap-5 p-5 sm:grid-cols-[200px_1fr]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shown.poster} alt={shown.title} className={`mx-auto aspect-[2/3] w-44 rounded-xl object-cover sm:w-full ${rolling ? "blur-[2px]" : ""}`} />
            <div className={rolling ? "opacity-60" : ""}>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded bg-accent px-2 py-0.5 font-bold">{CATEGORY_LABELS[shown.category]}</span>
                <span className="rounded bg-panel-2 px-2 py-0.5">{shown.quality}</span>
                <span className="flex items-center gap-1 text-gold"><Star className="h-3.5 w-3.5 fill-gold" /> {shown.imdb.toFixed(1)}</span>
              </div>
              <h2 className="mt-2 text-2xl font-extrabold">{shown.title}</h2>
              <p className="text-sm text-muted">
                {shown.originalTitle} • {shown.year} • {shown.country} • {shown.duration}
              </p>
              <p className="mt-2 text-sm text-muted">{shown.genres.join(", ")}</p>
              <p className="mt-3 line-clamp-4 text-gray-300">{shown.description}</p>
              {!rolling && (
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link href={`/kino/${shown.slug}`} className="btn btn-primary">
                    <Play className="h-4 w-4 fill-white" /> Tomosha qilish
                  </Link>
                  <button onClick={roll} className="btn btn-ghost">
                    <Dices className="h-4 w-4" /> Yana bir bor
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
