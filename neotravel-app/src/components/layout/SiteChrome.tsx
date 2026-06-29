import Link from "next/link";

const navLinks = [
  { href: "/", label: "Accueil" },
  { href: "/qui-sommes-nous", label: "Qui sommes-nous" },
  { href: "/chat", label: "Devis en ligne" },
  { href: "/devis", label: "Demande de devis" },
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
            Courtier en location d&apos;autocar avec chauffeur — devis rapide, flotte moderne,
            accompagnement personnalisé depuis 2010.
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
          <p className="text-sm font-semibold uppercase tracking-wide text-white">Contact</p>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            contact@neotravel.fr
            <br />
            Du lundi au vendredi, 9 h – 18 h
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} NeoTravel — Tous droits réservés
      </div>
    </footer>
  );
}
