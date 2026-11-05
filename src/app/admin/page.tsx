"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Edit3, LogOut, Plus, RotateCcw, Save, Search, ShieldCheck, Trash2, X } from "lucide-react";
import { useMovies } from "@/lib/movies-context";
import { deleteMovie, resetLocalDemo, saveMovie, slugify } from "@/lib/store";
import { isSupabaseEnabled, supabase } from "@/lib/supabase";
import { ALL_COUNTRIES, ALL_GENRES, CATEGORY_LABELS, type Category, type Episode, type Movie } from "@/lib/types";

// Demo rejim paroli (.env.local da NEXT_PUBLIC_ADMIN_PASSWORD bilan o'zgartiring).
// Diqqat: bu faqat demo/LocalStorage rejimi uchun. Haqiqiy saytda Supabase Auth ishlatiladi.
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123";

const emptyMovie = (): Movie => ({
  id: "",
  slug: "",
  title: "",
  originalTitle: "",
  category: "tarjima",
  genres: [],
  studio: "Marvel Studios",
  year: new Date().getFullYear(),
  country: "AQSH",
  duration: "1 s 45 daq",
  quality: "1080p Full HD",
  ageRating: "16+",
  imdb: 7,
  kp: 7,
  views: 0,
  isPremiere: true,
  isFeatured: false,
  director: "",
  cast: [],
  description: "",
  poster: "",
  backdrop: "",
  videoUrl: "",
  trailerUrl: "",
  episodes: [],
  createdAt: new Date().toISOString(),
});

function Login({ onOk }: { onOk: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (supabase) {
      setBusy(true);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return setErr(error.message);
      if (data.user?.app_metadata?.role !== "admin") {
        await supabase.auth.signOut();
        return setErr("Bu hisobda admin huquqi yo'q (app_metadata.role = 'admin' bo'lishi kerak).");
      }
      onOk();
    } else {
      if (password === DEMO_PASSWORD) {
        sessionStorage.setItem("asilkino_admin", "1");
        onOk();
      } else setErr("Parol noto'g'ri");
    }
  };

  return (
    <form onSubmit={submit} className="mx-auto mt-10 max-w-sm rounded-2xl border border-line bg-panel p-6">
      <ShieldCheck className="mx-auto h-10 w-10 text-accent" />
      <h1 className="mt-3 text-center text-xl font-bold">Admin panelga kirish</h1>
      <p className="mt-1 text-center text-xs text-muted">
        {isSupabaseEnabled ? "Supabase hisobingiz bilan kiring" : "Demo rejim: standart parol — admin123"}
      </p>
      <div className="mt-5 space-y-3">
        {isSupabaseEnabled && <input className="input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />}
        <input className="input" type="password" placeholder="Parol" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {err && <p className="text-sm text-accent">{err}</p>}
        <button className="btn btn-primary w-full" disabled={busy}>
          {busy ? "Kirilmoqda..." : "Kirish"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

function MovieForm({ initial, onClose, onSaved }: { initial: Movie; onClose: () => void; onSaved: () => void }) {
  const [m, setM] = useState<Movie>(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = <K extends keyof Movie>(k: K, v: Movie[K]) => setM((p) => ({ ...p, [k]: v }));

  const setEp = (i: number, patch: Partial<Episode>) =>
    set("episodes", m.episodes.map((e, k) => (k === i ? { ...e, ...patch } : e)));

  const addEp = () => {
    const last = m.episodes[m.episodes.length - 1];
    set("episodes", [
      ...m.episodes,
      {
        id: String(Date.now()),
        season: last?.season ?? 1,
        episode: (last?.episode ?? 0) + 1,
        title: `${(last?.episode ?? 0) + 1}-qism`,
        duration: "45 daq",
        videoUrl: "",
      },
    ]);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!m.genres.length) return setErr("Kamida bitta janr tanlang");
    setBusy(true);
    try {
      const slug = m.slug || slugify(m.title) || String(Date.now());
      await saveMovie({
        ...m,
        slug,
        poster: m.poster || `https://picsum.photos/seed/${slug}/400/600`,
        backdrop: m.backdrop || m.poster || `https://picsum.photos/seed/${slug}-bg/1280/720`,
      });
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Saqlashda xatolik");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-3 sm:p-8">
      <form onSubmit={submit} className="mx-auto max-w-3xl animate-fade-in rounded-2xl border border-line bg-panel p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{initial.id ? "Kinoni tahrirlash" : "Yangi kino qo'shish"}</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-white/10" aria-label="Yopish">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nomi (o'zbekcha) *">
            <input className="input" required value={m.title} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="Original nomi">
            <input className="input" value={m.originalTitle} onChange={(e) => set("originalTitle", e.target.value)} />
          </Field>
          <Field label="URL (slug) — bo'sh qoldirsangiz avtomatik">
            <input className="input" value={m.slug} placeholder={slugify(m.title)} onChange={(e) => set("slug", slugify(e.target.value))} />
          </Field>
          <Field label="Turi">
            <select className="input" value={m.category} onChange={(e) => set("category", e.target.value as Category)}>
              {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </select>
          </Field>
          <Field label="Kino studiya">
            <input className="input" list="studios" value={m.studio} onChange={(e) => set("studio", e.target.value)} placeholder="Marvel Studios, DC, Warner Bros..." />
            <datalist id="studios">
              {["Marvel Studios", "DC Studios", "20th Century Fox", "Warner Bros.", "Universal Pictures", "Sony Pictures", "Paramount Pictures", "Walt Disney Pictures"].map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </Field>
          <Field label="Yili">
            <input className="input" type="number" min={1900} max={2100} value={m.year} onChange={(e) => set("year", Number(e.target.value))} />
          </Field>
          <Field label="Davlati">
            <input className="input" list="countries" value={m.country} onChange={(e) => set("country", e.target.value)} />
            <datalist id="countries">{ALL_COUNTRIES.map((c) => <option key={c} value={c} />)}</datalist>
          </Field>
          <Field label="Davomiyligi">
            <input className="input" value={m.duration} onChange={(e) => set("duration", e.target.value)} />
          </Field>
          <Field label="Sifati">
            <select className="input" value={m.quality} onChange={(e) => set("quality", e.target.value)}>
              {["4K Ultra HD", "1080p Full HD", "720p HD", "480p", "CAMRip"].map((q) => <option key={q}>{q}</option>)}
            </select>
          </Field>
          <Field label="IMDb reyting">
            <input className="input" type="number" step={0.1} min={0} max={10} value={m.imdb} onChange={(e) => set("imdb", Number(e.target.value))} />
          </Field>
          <Field label="Kinopoisk reyting">
            <input className="input" type="number" step={0.1} min={0} max={10} value={m.kp} onChange={(e) => set("kp", Number(e.target.value))} />
          </Field>
          <Field label="Yosh chegarasi">
            <select className="input" value={m.ageRating} onChange={(e) => set("ageRating", e.target.value)}>
              {["0+", "6+", "12+", "16+", "18+"].map((a) => <option key={a}>{a}</option>)}
            </select>
          </Field>
          <Field label="Rejissyor">
            <input className="input" value={m.director} onChange={(e) => set("director", e.target.value)} />
          </Field>
          <Field label="Aktyorlar (vergul bilan)" full>
            <input
              className="input"
              value={m.cast.join(", ")}
              onChange={(e) => set("cast", e.target.value.split(",").map((s) => s.trimStart()).filter((s, i, a) => s || i === a.length - 1))}
            />
          </Field>
          <Field label="Janrlar *" full>
            <div className="flex flex-wrap gap-1.5">
              {ALL_GENRES.map((g) => {
                const on = m.genres.includes(g);
                return (
                  <button
                    type="button"
                    key={g}
                    onClick={() => set("genres", on ? m.genres.filter((x) => x !== g) : [...m.genres, g])}
                    className={`rounded-full border px-3 py-1 text-xs transition ${on ? "border-accent bg-accent text-white" : "border-line text-muted hover:border-accent"}`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Tavsif (sujet) *" full>
            <textarea className="input min-h-24" required value={m.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
          <Field label="Poster rasmi URL (vertikal)">
            <input className="input" type="url" value={m.poster} onChange={(e) => set("poster", e.target.value)} placeholder="https://..." />
          </Field>
          <Field label="Fon rasmi URL (gorizontal)">
            <input className="input" type="url" value={m.backdrop} onChange={(e) => set("backdrop", e.target.value)} placeholder="https://..." />
          </Field>
          <Field label={m.category === "serial" ? "Asosiy video URL (qismlar bo'lmasa)" : "Video URL * (MP4, YouTube yoki embed)"}>
            <input className="input" required={m.category !== "serial"} value={m.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} placeholder="https://.../film.mp4" />
          </Field>
          <Field label="Treyler URL (YouTube yoki MP4)">
            <input className="input" value={m.trailerUrl} onChange={(e) => set("trailerUrl", e.target.value)} placeholder="https://youtube.com/watch?v=..." />
          </Field>
          <div className="flex gap-5 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={m.isPremiere} onChange={(e) => set("isPremiere", e.target.checked)} className="accent-[#e50914]" /> Premyera
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={m.isFeatured} onChange={(e) => set("isFeatured", e.target.checked)} className="accent-[#e50914]" /> Bosh sahifa slayderida
            </label>
          </div>
        </div>

        {(m.category === "serial" || m.episodes.length > 0) && (
          <div className="mt-5 rounded-xl border border-line p-3">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold">Qismlar ({m.episodes.length})</h3>
              <button type="button" onClick={addEp} className="btn btn-ghost !py-1.5 text-xs">
                <Plus className="h-4 w-4" /> Qism qo&apos;shish
              </button>
            </div>
            <div className="space-y-2">
              {m.episodes.map((ep, i) => (
                <div key={ep.id} className="grid grid-cols-[60px_60px_1fr_auto] gap-2 sm:grid-cols-[60px_60px_1fr_2fr_auto]">
                  <input className="input" type="number" min={1} title="Fasl" value={ep.season} onChange={(e) => setEp(i, { season: Number(e.target.value) })} />
                  <input className="input" type="number" min={1} title="Qism" value={ep.episode} onChange={(e) => setEp(i, { episode: Number(e.target.value) })} />
                  <input className="input hidden sm:block" placeholder="Nomi" value={ep.title} onChange={(e) => setEp(i, { title: e.target.value })} />
                  <input className="input" placeholder="Video URL" required value={ep.videoUrl} onChange={(e) => setEp(i, { videoUrl: e.target.value })} />
                  <button type="button" onClick={() => set("episodes", m.episodes.filter((_, k) => k !== i))} className="rounded-lg px-2 text-muted hover:text-accent" aria-label="O'chirish">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {!m.episodes.length && <p className="text-sm text-muted">Hali qism qo&apos;shilmagan.</p>}
            </div>
          </div>
        )}

        {err && <p className="mt-3 text-sm text-accent">{err}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn btn-ghost">Bekor qilish</button>
          <button className="btn btn-primary" disabled={busy}>
            <Save className="h-4 w-4" /> {busy ? "Saqlanmoqda..." : "Saqlash"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminPage() {
  const { movies, reload } = useMovies();
  const [authed, setAuthed] = useState(() => typeof window !== "undefined" && !isSupabaseEnabled && sessionStorage.getItem("asilkino_admin") === "1");
  const [editing, setEditing] = useState<Movie | null>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");

  const list = useMemo(
    () => movies.filter((m) => (!cat || m.category === cat) && m.title.toLowerCase().includes(q.toLowerCase())),
    [movies, q, cat],
  );

  if (!authed) return <Login onOk={() => setAuthed(true)} />;

  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
    sessionStorage.removeItem("asilkino_admin");
    setAuthed(false);
  };

  const remove = async (m: Movie) => {
    if (!confirm(`"${m.title}" o'chirilsinmi?`)) return;
    try {
      await deleteMovie(m.id);
      await reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Xatolik");
    }
  };

  const stats = [
    ["Jami", movies.length],
    ["Tarjima kinolar", movies.filter((m) => m.category === "tarjima").length],
    ["Seriallar", movies.filter((m) => m.category === "serial").length],
    ["Multfilmlar", movies.filter((m) => m.category === "multfilm").length],
  ] as const;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Admin panel</h1>
          <p className="text-sm text-muted">
            Rejim: {isSupabaseEnabled ? "Supabase ma'lumotlar bazasi" : "Demo (brauzer LocalStorage)"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isSupabaseEnabled && (
            <button
              className="btn btn-ghost"
              onClick={async () => {
                if (confirm("Barcha o'zgarishlar o'chib, demo kinolar qaytarilsinmi?")) {
                  resetLocalDemo();
                  await reload();
                }
              }}
            >
              <RotateCcw className="h-4 w-4" /> Demoni tiklash
            </button>
          )}
          <button className="btn btn-primary" onClick={() => setEditing(emptyMovie())}>
            <Plus className="h-4 w-4" /> Kino qo&apos;shish
          </button>
          <button className="btn btn-ghost" onClick={logout}>
            <LogOut className="h-4 w-4" /> Chiqish
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map(([k, v]) => (
          <div key={k} className="rounded-xl border border-line bg-panel p-4">
            <div className="text-xs text-muted">{k}</div>
            <div className="mt-1 text-2xl font-extrabold">{v}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <div className="relative min-w-60 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input className="input !pl-9" placeholder="Nomi bo'yicha qidirish..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input !w-auto" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">Barcha turlar</option>
          {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
        </select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-panel-2 text-left text-xs uppercase text-muted">
            <tr>
              <th className="p-3">Kino</th>
              <th className="p-3">Turi</th>
              <th className="p-3">Yili</th>
              <th className="p-3">IMDb</th>
              <th className="p-3">Qismlar</th>
              <th className="p-3 text-right">Amallar</th>
            </tr>
          </thead>
          <tbody>
            {list.map((m) => (
              <tr key={m.id} className="border-t border-line hover:bg-panel">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.poster} alt="" className="h-14 w-10 rounded object-cover" />
                    <div>
                      <Link href={`/kino/${m.slug}`} className="font-semibold hover:text-accent">{m.title}</Link>
                      <div className="text-xs text-muted">
                        {m.genres.join(", ")} {m.isPremiere && <span className="text-gold">• Premyera</span>}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-muted">{CATEGORY_LABELS[m.category]}</td>
                <td className="p-3">{m.year}</td>
                <td className="p-3 text-gold">{m.imdb.toFixed(1)}</td>
                <td className="p-3">{m.episodes.length || "—"}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => setEditing(m)} className="rounded-lg p-2 hover:bg-panel-2 hover:text-accent" aria-label="Tahrirlash">
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button onClick={() => remove(m)} className="rounded-lg p-2 hover:bg-panel-2 hover:text-accent" aria-label="O'chirish">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!list.length && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted">Kino topilmadi</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <MovieForm
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await reload();
          }}
        />
      )}
    </div>
  );
}
