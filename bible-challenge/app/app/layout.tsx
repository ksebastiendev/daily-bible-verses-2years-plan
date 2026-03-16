import { ReactNode } from "react";
import Link from "next/link";

export default async function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-3">
        <div className="mx-auto w-full max-w-md">
          <h1 className="text-base font-semibold text-gray-900">Bible Challenge</h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-4 pb-24 pt-4">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 border-t border-gray-200 bg-white">
        <div className="mx-auto grid w-full max-w-md grid-cols-5">
          <Link href="/app/home" className="px-2 py-3 text-center text-xs font-medium text-gray-700">
            Home
          </Link>
          <Link
            href="/app/challenge"
            className="px-2 py-3 text-center text-xs font-medium text-gray-700"
          >
            Challenge
          </Link>
          <Link
            href="/app/reading"
            className="px-2 py-3 text-center text-xs font-medium text-gray-700"
          >
            Reading
          </Link>
          <Link
            href="/app/profile"
            className="px-2 py-3 text-center text-xs font-medium text-gray-700"
          >
            Profile
          </Link>
          <Link
            href="/app/leaderboard"
            className="px-2 py-3 text-center text-xs font-medium text-gray-700"
          >
            Ranking
          </Link>
        </div>
      </nav>
    </div>
  );
}
