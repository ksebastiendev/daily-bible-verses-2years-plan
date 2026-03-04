import Link from "next/link";

export default function Home() {
  const registerHref = "/login";

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="mx-auto flex w-full max-w-md flex-col gap-8 px-5 py-10 sm:max-w-lg sm:py-14">
        <header className="space-y-3 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Bible Challenge</h1>
          <p className="text-sm leading-6 text-gray-600 sm:text-base">
            Rejoins le défi de lecture biblique sur 2 ans, avance chaque jour et reste constant dans ta foi.
          </p>
        </header>

        <nav aria-label="Primary actions" className="space-y-3">
          <Link
            href="/login"
            className="block w-full rounded-lg bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Se connecter
          </Link>
          <Link
            href={registerHref}
            className="block w-full rounded-lg bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Créer un compte
          </Link>
          <Link
            href="/docs"
            className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            API Docs
          </Link>
        </nav>

        <section aria-label="Fonctionnalités" className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">Fonctionnalités</h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li>• Suivi de streak quotidien pour rester discipliné.</li>
            <li>• Système de points pour mesurer ta progression.</li>
            <li>• Lecture verset par verset, simple et guidée.</li>
          </ul>
        </section>

        <footer className="text-center text-xs text-gray-500">
          Fuseau horaire par défaut: Africa/Porto-Novo • PWA ready
        </footer>
      </section>
    </main>
  );
}
