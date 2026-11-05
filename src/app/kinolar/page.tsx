"use client";

import { Suspense, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchX } from "lucide-react";
import Filters, { matchesFilters, type FilterState } from "@/components/Filters";
import MovieCard, { MovieGridSkeleton } from "@/components/MovieCard";
import { useMovies } from "@/lib/movies-context";
import { ALL_COUNTRIES, CATEGORY_LABELS, type Category } from "@/lib/types";

const SORTS: Record<string, string> = {
  new: "Yangi qo'shilgan",
  year: "Chiqqan yili",
  rating: "Reyting (IMDb)",
  views: "Ko'rishlar soni",
  title: "Nomi (A-Z)",
};

function Catalog() {
  const { movies, loading } = useMovies();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const filters: FilterState = {
    cat: params.get("cat") ?? "",
    genre: params.get("genre") ?? "",
    year: params.get("year") ?? "",
    country: params.get("country") ?? "",
    studio: params.get("studio") ?? "",
  };
  const q = params.get("q") ?? "";
  const sort = params.get("sort") ?? "new";
  const premiere = params.get("premyera") === "1";

  const update = (patch: Record<string, string>) => {
    const sp = new URLSearchParams(params.toString());
    Object.entries(patch).forEach(([k, v]) => (v ? sp.set(k, v) : sp.delete(k)));
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
  };

  const countries = useMemo(
    () => Array.from(new Set([...ALL_COUNTRIES, ...movies.map((m) => m.country)])).sort(),
    [movies],
  );

  const list = useMemo(() => {
    const needle = q.toLowerCase();
    const res = movies.filter(
      (m) =>
        matchesFilters(m, filters) &&
        (!premiere || m.isPremiere) &&
        (!needle ||
          m.title.toLowerCase().includes(needle) ||
          m.originalTitle.toLowerCase().includes(needle) ||
          m.cast.some((c) => c.toLowerCase().includes(needle))),
    );
    const sorted = [...res];
    switch (sort) {
      case "year":
        sorted.sort((a, b) => b.year - a.year);
        break;
      case "rating":
        sorted.sort((a, b) => b.imdb - a.imdb);
        break;
      case "views":
        sorted.sort((a, b) => b.views - a.views);
        break;
      case "title":
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return sorted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movies, params]);

  const heading = q
    ? `"${q}" bo'yicha qidiruv natijalari`
    : premiere
      ? "Premyeralar"
      : filters.studio
        ? `${filters.studio} kinolari`
        : filters.genre
          ? `${filters.genre} janridagi kinolar`
          : filters.cat
            ? CATEGORY_LABELS[filters.cat as Category]
            : "Barcha kinolar";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="border-l-4 border-accent pl-3 text-2xl font-bold">{heading}</h1>
          <p className="mt-1 pl-4 text-sm text-muted">{loading ? "Yuklanmoqda..." : `${list.length} ta natija topildi`}</p>
        </div>
        <div className="flex items-center gap-2">
          {premiere && (
            <button className="btn btn-ghost !py-2" onClick={() => update({ premyera: "" })}>
              Premyera ✕
            </button>
          )}
          {q && (
            <button className="btn btn-ghost !py-2" onClick={() => update({ q: "" })}>
              Qidiruv ✕
            </button>
          )}
          <select className="input !w-auto" value={sort} onChange={(e) => update({ sort: e.target.value })}>
            {Object.entries(SORTS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Filters value={filters} onChange={(f) => update({ ...f })} countries={countries} />

      <div className="mt-6">
        {loading ? (
          <MovieGridSkeleton />
        ) : list.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {list.map((m) => (
              <MovieCard key={m.id} movie={m} />
            ))}
          </div>
        ) : (
          <div className="grid place-items-center rounded-xl border border-dashed border-line py-20 text-center text-muted">
            <SearchX className="mb-3 h-10 w-10" />
            Hech narsa topilmadi. Filtrlarni o&apos;zgartirib ko&apos;ring.
          </div>
        )}
      </div>
    </div>
  );
}

export default function KinolarPage() {
  return (
    <Suspense fallback={<MovieGridSkeleton />}>
      <Catalog />
    </Suspense>
  );
}
