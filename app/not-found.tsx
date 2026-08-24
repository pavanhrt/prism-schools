import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

import { SchoolLogo } from "@/components/school/school-logo";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-prism-bg px-4 py-16">
      <div className="w-full max-w-2xl rounded-3xl border border-prism-gold/30 bg-white p-8 text-center shadow-xl sm:p-12">
        <div className="flex justify-center">
          <SchoolLogo />
        </div>
        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-prism-gold-ink">
          Page not found
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-prism-navy sm:text-5xl">
          This path does not lead to a PRISM page.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-prism-muted sm:text-lg">
          The page may have moved or the address may be incomplete. Choose a path
          below to continue exploring PRISM.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-prism-navy px-6 py-3 font-semibold text-white transition hover:bg-prism-navy/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-prism-gold focus-visible:ring-offset-2"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
            Return home
          </Link>
          <Link
            href="/admissions"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-prism-navy px-6 py-3 font-semibold text-prism-navy transition hover:bg-prism-navy/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-prism-gold focus-visible:ring-offset-2"
          >
            <Compass className="size-5" aria-hidden="true" />
            Explore admissions
          </Link>
        </div>
      </div>
    </main>
  );
}
