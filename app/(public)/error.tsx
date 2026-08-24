"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { RefreshCcw } from "lucide-react";

type PublicErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function PublicError({ reset }: PublicErrorProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section
      aria-labelledby="public-error-heading"
      className="flex min-h-[70vh] items-center justify-center bg-prism-bg px-4 py-16"
    >
      <div className="w-full max-w-2xl rounded-3xl border border-prism-gold/30 bg-white p-8 text-center shadow-xl sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-prism-gold-ink">
          Something went wrong
        </p>
        <h1
          ref={headingRef}
          id="public-error-heading"
          tabIndex={-1}
          className="mt-3 text-3xl font-bold tracking-tight text-prism-navy outline-none sm:text-5xl"
        >
          This page could not be displayed.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-prism-muted sm:text-lg">
          Your information is safe. Please try again, or return home and continue
          from there.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-prism-navy px-6 py-3 font-semibold text-white transition hover:bg-prism-navy/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-prism-gold focus-visible:ring-offset-2"
          >
            <RefreshCcw className="size-5" aria-hidden="true" />
            Retry
          </button>
          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-prism-navy px-6 py-3 font-semibold text-prism-navy transition hover:bg-prism-navy/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-prism-gold focus-visible:ring-offset-2"
          >
            Return home
          </Link>
        </div>
      </div>
    </section>
  );
}
