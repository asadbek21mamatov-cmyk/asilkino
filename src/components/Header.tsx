"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Clapperboard, Menu, Search, Shuffle, X, ChevronDown } from "lucide-react";
import { ALL_GENRES } from "@/lib/types";

const NAV = [
  { href: "/", label: "Bosh sahifa" },
  { href: "/kinolar?cat=tarjima", label: "Tarjima kinolar" },
  { href: "/kinolar?cat=serial", label: "Seriallar" },
  { href: "/kinolar?cat=multfilm", label: "Multfilmlar" },
  { href: "/kinolar?premyera=1", label: "Premyeralar" },
];

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [genresOpen, setGenresOpen] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setOpen(false);
    router.push(`/kinolar?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-3 py-3 sm:px-5">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent shadow-lg shadow-accent/30">
            <Clapperboard className="h-5 w-5 text-white" />
          </span>
          <span className="text-xl font-extrabold tracking-tight">
            Asil<span className="text-accent">Kino</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`rounded-md px-3 py-2 text-sm font-medium transition hover:bg-panel-2 hover:text-white ${
                pathname === n.href ? "text-white" : "text-muted"
              }`}
            >
              {n.label}
            </Link>
          ))}
          <div className="relative" onMouseLeave={() => setGenresOpen(false)}>
            <button
              onMouseEnter={() => setGenresOpen(true)}
              onClick={() => setGenresOpen((v) => !v)}
              className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-muted hover:bg-panel-2 hover:text-white"
            >
              Janrlar <ChevronDown className="h-4 w-4" />
            </button>
            {genresOpen && (
              <div className="absolute left-0 top-full grid w-80 grid-cols-2 gap-1 rounded-xl border border-line bg-panel p-2 shadow-2xl">
                {ALL_GENRES.map((g) => (
                  <Link
                    key={g}
                    href={`/kinolar?genre=${encodeURIComponent(g)}`}
                    onClick={() => setGenresOpen(false)}
                    className="rounded-md px-3 py-1.5 text-sm text-muted hover:bg-panel-2 hover:text-accent"
                  >
                    {g}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        <form onSubmit={submit} className="ml-auto hidden max-w-xs flex-1 md:block">
          <div className="relative">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Kino qidirish..."
              className="input pr-9"
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-accent" aria-label="Qidirish">
              <Search className="h-4 w-4" />
            </button>
          </div>
        </form>

        <Link href="/random" className="btn btn-primary hidden !py-2 sm:inline-flex">
          <Shuffle className="h-4 w-4" /> Tasodifiy
        </Link>

        <button className="ml-auto rounded-md p-2 hover:bg-panel-2 md:ml-0 lg:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menyu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="animate-fade-in border-t border-line bg-panel px-3 pb-4 pt-3 lg:hidden">
          <form onSubmit={submit} className="mb-3 md:hidden">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Kino qidirish..." className="input" />
          </form>
          <div className="grid gap-1">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm hover:bg-panel-2">
                {n.label}
              </Link>
            ))}
            <Link href="/random" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-semibold text-accent hover:bg-panel-2">
              🎲 Tasodifiy kino
            </Link>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {ALL_GENRES.map((g) => (
              <Link
                key={g}
                href={`/kinolar?genre=${encodeURIComponent(g)}`}
                onClick={() => setOpen(false)}
                className="rounded-full border border-line px-3 py-1 text-xs text-muted hover:border-accent hover:text-white"
              >
                {g}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
