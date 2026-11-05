import Link from "next/link";
import { Clapperboard, Send, Video, Globe } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-10 border-t border-line bg-panel/60">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent">
              <Clapperboard className="h-4 w-4 text-white" />
            </span>
            <span className="text-lg font-extrabold">
              Asil<span className="text-accent">Kino</span>
            </span>
          </Link>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            O&apos;zbek tilidagi tarjima kinolar, seriallar va multfilmlarni HD sifatda onlayn tomosha qiling.
          </p>
        </div>
        <div>
          <h4 className="mb-3 font-semibold">Bo&apos;limlar</h4>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link className="hover:text-accent" href="/kinolar?cat=tarjima">Tarjima kinolar</Link></li>
            <li><Link className="hover:text-accent" href="/kinolar?cat=serial">Seriallar</Link></li>
            <li><Link className="hover:text-accent" href="/kinolar?cat=multfilm">Multfilmlar</Link></li>
            <li><Link className="hover:text-accent" href="/kinolar?premyera=1">Premyeralar</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold">Foydali</h4>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link className="hover:text-accent" href="/random">Tasodifiy kino</Link></li>
            <li><Link className="hover:text-accent" href="/kinolar?sort=rating">Eng yuqori reyting</Link></li>
            <li><Link className="hover:text-accent" href="/admin">Admin panel</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold">Biz ijtimoiy tarmoqlarda</h4>
          <div className="flex gap-2">
            {[Send, Video, Globe].map((Icon, i) => (
              <a key={i} href="#" className="grid h-10 w-10 place-items-center rounded-lg border border-line bg-panel-2 hover:border-accent hover:text-accent">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} AsilKino. Barcha huquqlar himoyalangan.
      </div>
    </footer>
  );
}
