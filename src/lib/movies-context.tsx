"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { fetchMovies } from "./store";
import type { Movie } from "./types";

interface MoviesCtx {
  movies: Movie[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

const Ctx = createContext<MoviesCtx>({ movies: [], loading: true, error: null, reload: async () => {} });

export function MoviesProvider({ children }: { children: ReactNode }) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setError(null);
      setMovies(await fetchMovies());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return <Ctx.Provider value={{ movies, loading, error, reload }}>{children}</Ctx.Provider>;
}

export const useMovies = () => useContext(Ctx);
