import Link from "next/link";
import { Eye, Play, Star } from "lucide-react";
import type { Movie } from "@/lib/types";
import { formatViews } from "@/lib/store";

export default function MovieCard({ movie }: { movie: Movie }) {
  return (
    <Link href={`/kino/${movie.slug}`} className="group block animate-fade-in">
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-line bg-panel">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={movie.poster}
          alt={movie.title}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-110 group-hover:brightness-50"
        />
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {movie.studio && (
            <span className="rounded bg-black/85 backdrop-blur-sm border border-white/20 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-white tracking-wider shadow">
              {movie.studio.replace(" Studios", "").replace(" Pictures", "")}
            </span>
          )}
          <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
            {movie.quality.split(" ")[0]}
          </span>
          {movie.isPremiere && (
            <span className="rounded bg-gold px-1.5 py-0.5 text-[10px] font-bold uppercase text-black">Premyera</span>
          )}
        </div>
        <span className="absolute right-2 top-2 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-xs font-semibold text-gold">
          <Star className="h-3 w-3 fill-gold" /> {movie.imdb.toFixed(1)}
        </span>
        {movie.category === "serial" && movie.episodes.length > 0 && (
          <span className="absolute bottom-2 left-2 rounded bg-black/70 px-1.5 py-0.5 text-[11px] text-white">
            {movie.episodes.length} qism
          </span>
        )}
        <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-[11px] text-white">
          <Eye className="h-3 w-3" /> {formatViews(movie.views)}
        </span>
        <div className="absolute inset-0 grid place-items-center opacity-0 transition group-hover:opacity-100">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-accent shadow-xl shadow-accent/40">
            <Play className="ml-1 h-6 w-6 fill-white text-white" />
          </span>
        </div>
      </div>
      <h3 className="mt-2 line-clamp-1 text-sm font-semibold group-hover:text-accent">{movie.title}</h3>
      <p className="line-clamp-1 text-xs text-muted">
        {movie.year} • {movie.genres.slice(0, 2).join(", ")}
      </p>
    </Link>
  );
}

export function MovieGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <div className="aspect-[2/3] animate-pulse rounded-xl bg-panel" />
          <div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-panel" />
        </div>
      ))}
    </div>
  );
}
