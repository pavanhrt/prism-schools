"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SchoolLogo } from "@/components/school/school-logo";

interface NavItem {
  href: string;
  label: string;
}

interface SiteHeaderProps {
  schoolName: string;
  nav: NavItem[];
}

export function SiteHeader({ schoolName, nav }: SiteHeaderProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <SchoolLogo size={44} priority />
          <span className="hidden text-base font-semibold tracking-tight text-prism-navy sm:inline">
            {schoolName}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "text-prism-navy"
                  : "text-slate-600 hover:text-prism-navy",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/auth/login"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-prism-navy"
          >
            Login
          </Link>
          <Link
            href="/admissions"
            className="rounded-md bg-prism-navy px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-prism-navy-light"
          >
            Admissions
          </Link>
        </div>

        <button
          type="button"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-prism-navy transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-prism-navy lg:hidden"
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className="h-6 w-6">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            )}
          </svg>
        </button>
      </div>

      <div
        id="mobile-nav"
        className={cn(
          "overflow-hidden border-t border-slate-200 transition-[max-height] duration-200 ease-in-out lg:hidden",
          open ? "max-h-[28rem]" : "max-h-0 border-t-0",
        )}
      >
        <nav className="flex flex-col gap-1 px-5 py-4" aria-label="Mobile">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              onClick={() => setOpen(false)}
              className={cn(
                "rounded-md px-3 py-2.5 text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-prism-navy",
                isActive(item.href)
                  ? "bg-prism-bg text-prism-navy"
                  : "text-slate-700 hover:bg-slate-50 hover:text-prism-navy",
              )}
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-2 flex flex-col gap-2 border-t border-slate-100 pt-4">
            <Link
              href="/auth/login"
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2.5 text-base font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-prism-navy"
            >
              Login
            </Link>
            <Link
              href="/admissions"
              onClick={() => setOpen(false)}
              className="rounded-md bg-prism-navy px-4 py-2.5 text-center text-base font-semibold text-white transition-colors hover:bg-prism-navy-light"
            >
              Admissions
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
