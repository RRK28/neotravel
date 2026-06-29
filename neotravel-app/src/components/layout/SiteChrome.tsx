import Link from "next/link";

/** Navigation — Option A (/chat) avant Option B (/devis). */
const navLinks = [
  { href: "/", label: "Accueil" },
  { href: "/qui-sommes-nous", label: "Qui sommes-nous" },
  { href: "/chat", label: "Assistant IA" },
  { href: "/devis", label: "Devis rapide" },
  { href: "/admin", label: "Admin" },
] as const;

export function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold tracking-tight text-[var(--color-brand)]">
          NeoTravel
        </Link>
        <nav className="flex flex-wrap items-center gap-1 sm:gap-2">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-[var(--color-brand)]"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-[var(--color-brand)] text-slate-200">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 sm:grid-cols-3">
        <div>
          <p className="text-lg font-semibold text-white">NeoTravel</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            Plateforme de devis transport autocar — projet pédagogique Epitech 2026.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-white">Navigation</p>
          <ul className="mt-3 space-y-2 text-sm">
            {navLinks.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className="text-slate-300 hover:text-white hover:underline">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-white">Projet</p>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            Module Data Science — Groupe 16
            <br />
            Epitech 2026
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} NeoTravel — Projet étudiant
      </div>
    </footer>
  );
}
